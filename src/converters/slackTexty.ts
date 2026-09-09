import {
	formatAlignedTable,
	isSafeUrl,
	isTableSeparatorRow,
	resolveWikilinks,
} from "./common";
import { convertToSlack } from "./slack";

export interface DeltaOp {
	insert: string;
	attributes?: Record<string, any>;
}

export interface SlackTextyResult {
	texty: string;
	markdown: string;
	plain: string;
}

export interface InlineAttr {
	bold?: boolean;
	italic?: boolean;
	strike?: boolean;
	code?: boolean;
	link?: string;
	underline?: boolean;
}

/**
 * Regex for inline markdown tokens:
 * - Inline math: $formula$
 * - Link: [title](url)
 * - Inline code: `code`
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Strikethrough: ~~text~~
 * - Underline: <u>text</u>
 */
function createInlineTokenRegex(): RegExp {
	return /(\$(?!\$)([^\s\$](?:[^$\n]*?[^\s\$])?)\$(?!\d|\$)|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|(?<!\*)\*([^\s*](?:[\s\S]*?[^\s*])?)\*(?!\*)|(?<!_)_([^\s_](?:[\s\S]*?[^\s_])?)_(?!_)|~~([\s\S]+?)~~|<u>([\s\S]+?)<\/u>)/g;
}

/**
 * Parses inline formatting (links, code, bold, italic, strike, underline)
 * into a sequence of Delta operations with appropriate formatting attributes.
 */
export function parseInlineToOps(text: string, currentAttrs: InlineAttr = {}): DeltaOp[] {
	if (!text) return [];

	const tokenRegex = createInlineTokenRegex();
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	const ops: DeltaOp[] = [];

	const pushPlain = (str: string) => {
		if (str.length > 0) {
			ops.push({
				insert: str,
				...(Object.keys(currentAttrs).length > 0 ? { attributes: { ...currentAttrs } } : {}),
			});
		}
	};

	while ((match = tokenRegex.exec(text)) !== null) {
		const matchIndex = match.index;
		if (matchIndex > lastIndex) {
			pushPlain(text.slice(lastIndex, matchIndex));
		}

		const fullMatch = match[0];
		const [, , math, linkTitle, linkUrl, code, boldAst, boldUnd, italicAst, italicUnd, strike, underline] = match;

		if (math !== undefined) {
			ops.push({
				insert: fullMatch,
				...(Object.keys(currentAttrs).length > 0 ? { attributes: { ...currentAttrs } } : {}),
			});
		} else if (linkTitle !== undefined && linkUrl !== undefined) {
			const cleanUrl = linkUrl.trim();
			if (isSafeUrl(cleanUrl)) {
				ops.push(...parseInlineToOps(linkTitle, { ...currentAttrs, link: cleanUrl }));
			} else {
				ops.push(...parseInlineToOps(linkTitle, currentAttrs));
			}
		} else if (code !== undefined) {
			ops.push({
				insert: code,
				attributes: { ...currentAttrs, code: true },
			});
		} else if (boldAst !== undefined || boldUnd !== undefined) {
			const inner = boldAst ?? boldUnd;
			ops.push(...parseInlineToOps(inner, { ...currentAttrs, bold: true }));
		} else if (italicAst !== undefined || italicUnd !== undefined) {
			const inner = italicAst ?? italicUnd;
			ops.push(...parseInlineToOps(inner, { ...currentAttrs, italic: true }));
		} else if (strike !== undefined) {
			ops.push(...parseInlineToOps(strike, { ...currentAttrs, strike: true }));
		} else if (underline !== undefined) {
			ops.push(...parseInlineToOps(underline, { ...currentAttrs, underline: true }));
		}

		lastIndex = matchIndex + fullMatch.length;
	}

	if (lastIndex < text.length) {
		pushPlain(text.slice(lastIndex));
	}

	return ops;
}

/**
 * Tracks relative indentation across consecutive list items and caps strictly at
 * Slack's maximum depth limit (indent: 4).
 * Works uniformly across 2-space, 3-space, 4-space, and tab indentations.
 */
export class IndentTracker {
	private stack: number[] = [0];

	reset(): void {
		this.stack = [0];
	}

	getLevel(rawIndentStr: string): number {
		const width = rawIndentStr.replace(/\t/g, "    ").length;
		if (width === 0) {
			this.stack = [0];
			return 0;
		}

		const last = this.stack[this.stack.length - 1];
		if (width > last) {
			this.stack.push(width);
		} else if (width < last) {
			while (this.stack.length > 1 && width < this.stack[this.stack.length - 1]) {
				this.stack.pop();
			}
			if (width > this.stack[this.stack.length - 1]) {
				this.stack.push(width);
			}
		}

		// Slack supports up to indent: 4 (5 levels: 0, 1, 2, 3, 4)
		const level = this.stack.length - 1;
		return Math.min(4, Math.max(0, level));
	}
}

/**
 * Checks equality of two Delta attribute records.
 */
function areAttrsEqual(a?: Record<string, any>, b?: Record<string, any>): boolean {
	if (!a && !b) return true;
	if (!a || !b) return false;
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) return false;
	return keysA.every((k) => a[k] === b[k]);
}

/**
 * Compresses adjacent Delta operations with identical attributes into single operations.
 */
function compactOps(rawOps: DeltaOp[]): DeltaOp[] {
	const compacted: DeltaOp[] = [];

	for (const op of rawOps) {
		if (!op.insert) continue;

		if (compacted.length === 0) {
			compacted.push({ ...op });
			continue;
		}

		const prev = compacted[compacted.length - 1];
		if (
			areAttrsEqual(prev.attributes, op.attributes) &&
			!prev.insert.endsWith("\n") &&
			!op.insert.startsWith("\n")
		) {
			prev.insert += op.insert;
		} else {
			compacted.push({ ...op });
		}
	}

	return compacted;
}

/**
 * Generates newline Delta operation with list attributes.
 */
function createListNewlineOp(type: "bullet" | "ordered", indent: number): DeltaOp {
	const listAttrs: Record<string, any> = { list: type };
	if (indent > 0) {
		listAttrs.indent = indent;
	}
	return { insert: "\n", attributes: listAttrs };
}

/**
 * Parses a code block fence and code body lines into code-block Delta operations.
 */
function parseCodeBlock(
	lines: string[],
	startIndex: number
): { ops: DeltaOp[]; nextIndex: number } {
	const firstLine = lines[startIndex];
	const fenceMatch = firstLine.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
	if (!fenceMatch) {
		return { ops: [], nextIndex: startIndex + 1 };
	}

	const fenceChar = fenceMatch[1][0];
	const fenceLen = fenceMatch[1].length;
	const lang = fenceMatch[2].trim();

	// Avoid false positive if inline backticks follow
	if (fenceChar === "`" && lang.includes("`")) {
		return { ops: [], nextIndex: startIndex };
	}

	const ops: DeltaOp[] = [];
	if (lang) {
		ops.push({ insert: lang });
		ops.push({ insert: "\n", attributes: { "code-block": true } });
	}

	let j = startIndex + 1;
	let closed = false;
	while (j < lines.length) {
		const closeMatch = lines[j].match(/^ {0,3}(`{3,}|~{3,})\s*$/);
		if (closeMatch && closeMatch[1][0] === fenceChar && closeMatch[1].length >= fenceLen) {
			closed = true;
			break;
		}

		const codeLine = lines[j];
		if (codeLine.length > 0) {
			ops.push({ insert: codeLine });
		}
		ops.push({ insert: "\n", attributes: { "code-block": true } });
		j++;
	}

	return {
		ops,
		nextIndex: closed ? j + 1 : lines.length,
	};
}

/**
 * Parses Markdown table rows and formats them into an aligned monospace code block.
 */
function parseTableBlock(
	lines: string[],
	startIndex: number
): { ops: DeltaOp[]; nextIndex: number } {
	const tableLines: string[] = [];
	let j = startIndex;
	while (j < lines.length && lines[j].trim().includes("|") && lines[j].trim() !== "") {
		tableLines.push(lines[j]);
		j++;
	}

	const aligned = formatAlignedTable(tableLines);
	const ops: DeltaOp[] = [];
	for (const tableLine of aligned.split("\n")) {
		if (tableLine.length > 0) {
			ops.push({ insert: tableLine });
		}
		ops.push({ insert: "\n", attributes: { "code-block": true } });
	}

	return { ops, nextIndex: j };
}

/**
 * Parses a single blockquote or Obsidian callout line.
 */
function parseQuoteOrCallout(line: string): DeltaOp[] {
	const ops: DeltaOp[] = [];
	const calloutMatch = line.match(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/);
	if (calloutMatch) {
		const label = calloutMatch[2].trim() || calloutMatch[1].toUpperCase();
		ops.push({ insert: `[${label}]`, attributes: { bold: true } });
		ops.push({ insert: "\n", attributes: { blockquote: true } });
		return ops;
	}

	const quoteContent = line.replace(/^>\s?/, "");
	if (quoteContent.length > 0) {
		ops.push(...parseInlineToOps(quoteContent));
	}
	ops.push({ insert: "\n", attributes: { blockquote: true } });
	return ops;
}

/**
 * Converts Markdown source into Slack native clipboard representations:
 * 1. `slack/texty`: Quill Delta JSON (`{"ops": [...]}`)
 * 2. `text/markdown`: Standard clean Markdown
 * 3. `text/plain`: Slack mrkdwn plain text
 */
export function convertToSlackTexty(source: string): SlackTextyResult {
	const resolvedSource = resolveWikilinks(source);
	const lines = resolvedSource.split("\n");
	const rawOps: DeltaOp[] = [];
	const indentTracker = new IndentTracker();
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		// 1. Code Block Fence (``` or ~~~)
		const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
		if (fenceMatch && !(fenceMatch[1][0] === "`" && fenceMatch[2].includes("`"))) {
			indentTracker.reset();
			const res = parseCodeBlock(lines, i);
			rawOps.push(...res.ops);
			i = res.nextIndex;
			continue;
		}

		// 2. Table Block (rendered as aligned monospace code block)
		if (line.includes("|") && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
			indentTracker.reset();
			const res = parseTableBlock(lines, i);
			rawOps.push(...res.ops);
			i = res.nextIndex;
			continue;
		}

		// 3. Block Math ($$...$$)
		if (line.trim().startsWith("$$")) {
			indentTracker.reset();
			const singleMatch = line.match(/^(\s*)\$\$(.+?)\$\$\s*$/);
			if (singleMatch) {
				rawOps.push({ insert: "$$" });
				rawOps.push({ insert: "\n" });
				rawOps.push({ insert: singleMatch[2].trim() });
				rawOps.push({ insert: "\n" });
				rawOps.push({ insert: "$$" });
				rawOps.push({ insert: "\n" });
				i++;
				continue;
			}

			const mathLines: string[] = [];
			let j = i + 1;
			let closed = false;
			while (j < lines.length) {
				if (lines[j].trim() === "$$") {
					closed = true;
					break;
				}
				mathLines.push(lines[j]);
				j++;
			}

			rawOps.push({ insert: "$$" });
			rawOps.push({ insert: "\n" });
			for (const mLine of mathLines) {
				rawOps.push({ insert: mLine });
				rawOps.push({ insert: "\n" });
			}
			if (closed) {
				rawOps.push({ insert: "$$" });
				rawOps.push({ insert: "\n" });
				i = j + 1;
			} else {
				i = lines.length;
			}
			continue;
		}

		// 4. Callout / Blockquote
		if (line.match(/^>\s?/)) {
			indentTracker.reset();
			rawOps.push(...parseQuoteOrCallout(line));
			i++;
			continue;
		}

		// 4. Task List (Checkbox: - [ ] or - [x])
		const taskMatch = line.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
		if (taskMatch) {
			const indent = indentTracker.getLevel(taskMatch[1]);
			const isChecked = taskMatch[2].toLowerCase() === "x";
			const symbol = isChecked ? "☑ " : "☐ ";
			const text = taskMatch[3];

			rawOps.push({ insert: symbol });
			rawOps.push(...parseInlineToOps(text, isChecked ? { strike: true } : {}));
			rawOps.push(createListNewlineOp("bullet", indent));
			i++;
			continue;
		}

		// 5. Bullet List (- item, * item, + item)
		const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
		if (bulletMatch) {
			const indent = indentTracker.getLevel(bulletMatch[1]);
			rawOps.push(...parseInlineToOps(bulletMatch[2]));
			rawOps.push(createListNewlineOp("bullet", indent));
			i++;
			continue;
		}

		// 6. Ordered List (1. item)
		const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
		if (orderedMatch) {
			const indent = indentTracker.getLevel(orderedMatch[1]);
			rawOps.push(...parseInlineToOps(orderedMatch[2]));
			rawOps.push(createListNewlineOp("ordered", indent));
			i++;
			continue;
		}

		// 7. Heading (# H1 ... ###### H6)
		const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
		if (headingMatch) {
			indentTracker.reset();
			rawOps.push(...parseInlineToOps(headingMatch[1], { bold: true }));
			rawOps.push({ insert: "\n" });
			i++;
			continue;
		}

		// 8. Horizontal Rule
		if (/^(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
			indentTracker.reset();
			rawOps.push({ insert: "───\n" });
			i++;
			continue;
		}

		// 9. Standard Paragraph Line
		indentTracker.reset();
		if (line.length === 0) {
			rawOps.push({ insert: "\n" });
		} else {
			rawOps.push(...parseInlineToOps(line));
			rawOps.push({ insert: "\n" });
		}
		i++;
	}

	const ops = compactOps(rawOps);
	const textyJson = JSON.stringify({ ops });
	const plain = convertToSlack(source);

	return {
		texty: textyJson,
		markdown: resolvedSource,
		plain,
	};
}
