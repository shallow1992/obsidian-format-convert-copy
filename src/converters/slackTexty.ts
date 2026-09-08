import {
	escapeHtml,
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
 * Parses inline formatting (links, code, bold, italic, strike, underline)
 * into a list of Delta operations with appropriate attributes.
 */
export function parseInlineToOps(text: string, currentAttrs: InlineAttr = {}): DeltaOp[] {
	if (!text) return [];

	// Token patterns:
	// 1. Link: [title](url)
	// 2. Inline code: `code`
	// 3. Bold: **text** or __text__
	// 4. Italic: *text* or _text_
	// 5. Strike: ~~text~~
	// 6. Underline: <u>text</u>
	const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|(?<!\*)\*([^\s*](?:[\s\S]*?[^\s*])?)\*(?!\*)|(?<!_)_([^\s_](?:[\s\S]*?[^\s_])?)_(?!_)|~~([\s\S]+?)~~|<u>([\s\S]+?)<\/u>)/g;

	let lastIndex = 0;
	let match: RegExpExecArray | null;
	const ops: DeltaOp[] = [];

	while ((match = tokenRegex.exec(text)) !== null) {
		const matchIndex = match.index;
		if (matchIndex > lastIndex) {
			const plain = text.slice(lastIndex, matchIndex);
			ops.push({
				insert: plain,
				...(Object.keys(currentAttrs).length > 0 ? { attributes: { ...currentAttrs } } : {}),
			});
		}

		const fullMatch = match[0];
		if (match[2] !== undefined && match[3] !== undefined) {
			// Link: [title](url)
			const title = match[2];
			const url = match[3].trim();
			if (isSafeUrl(url)) {
				ops.push(...parseInlineToOps(title, { ...currentAttrs, link: url }));
			} else {
				ops.push(...parseInlineToOps(title, currentAttrs));
			}
		} else if (match[4] !== undefined) {
			// Inline code: `code`
			ops.push({
				insert: match[4],
				attributes: { ...currentAttrs, code: true },
			});
		} else if (match[5] !== undefined || match[6] !== undefined) {
			// Bold: **text** or __text__
			const inner = match[5] ?? match[6];
			ops.push(...parseInlineToOps(inner, { ...currentAttrs, bold: true }));
		} else if (match[7] !== undefined || match[8] !== undefined) {
			// Italic: *text* or _text_
			const inner = match[7] ?? match[8];
			ops.push(...parseInlineToOps(inner, { ...currentAttrs, italic: true }));
		} else if (match[9] !== undefined) {
			// Strike: ~~text~~
			ops.push(...parseInlineToOps(match[9], { ...currentAttrs, strike: true }));
		} else if (match[10] !== undefined) {
			// Underline: <u>text</u>
			ops.push(...parseInlineToOps(match[10], { ...currentAttrs, underline: true }));
		}

		lastIndex = matchIndex + fullMatch.length;
	}

	if (lastIndex < text.length) {
		const remaining = text.slice(lastIndex);
		ops.push({
			insert: remaining,
			...(Object.keys(currentAttrs).length > 0 ? { attributes: { ...currentAttrs } } : {}),
		});
	}

	return ops;
}

/**
 * Tracks relative indentation across consecutive list items and caps at Slack's maximum depth (indent: 4).
 * Works uniformly whether users indent using 2 spaces, 3 spaces, 4 spaces, or tabs.
 */
export class IndentTracker {
	private stack: number[] = [0];

	reset(): void {
		this.stack = [0];
	}

	getLevel(rawIndentStr: string): number {
		const w = rawIndentStr.replace(/\t/g, "    ").length;
		if (w === 0) {
			this.stack = [0];
			return 0;
		}

		const last = this.stack[this.stack.length - 1];
		if (w > last) {
			this.stack.push(w);
		} else if (w < last) {
			while (this.stack.length > 1 && w < this.stack[this.stack.length - 1]) {
				this.stack.pop();
			}
			if (w > this.stack[this.stack.length - 1]) {
				this.stack.push(w);
			}
		}

		// Slack supports up to indent: 4 (5 levels: indent: 0, 1, 2, 3, 4)
		const level = this.stack.length - 1;
		return Math.min(4, Math.max(0, level));
	}
}

/**
 * Compresses adjacent Delta operations with identical attributes.
 */
function compactOps(rawOps: DeltaOp[]): DeltaOp[] {
	const compacted: DeltaOp[] = [];

	for (const op of rawOps) {
		if (compacted.length === 0) {
			compacted.push(op);
			continue;
		}

		const prev = compacted[compacted.length - 1];
		const prevAttrs = prev.attributes;
		const currAttrs = op.attributes;

		const bothNoAttrs = !prevAttrs && !currAttrs;
		const sameAttrs =
			prevAttrs &&
			currAttrs &&
			Object.keys(prevAttrs).length === Object.keys(currAttrs).length &&
			Object.entries(prevAttrs).every(([k, v]) => currAttrs[k] === v);

		if ((bothNoAttrs || sameAttrs) && !prev.insert.endsWith("\n") && !op.insert.startsWith("\n")) {
			prev.insert += op.insert;
		} else {
			compacted.push(op);
		}
	}

	return compacted;
}

/**
 * Converts Markdown into Slack native clipboard representations:
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

		// 1. Code Block Fence
		const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
		if (fenceMatch) {
			indentTracker.reset();
			const fenceChar = fenceMatch[1][0];
			const fenceLen = fenceMatch[1].length;
			const lang = fenceMatch[2].trim();

			if (!(fenceChar === "`" && lang.includes("`"))) {
				if (lang) {
					rawOps.push({ insert: lang });
					rawOps.push({ insert: "\n", attributes: { "code-block": true } });
				}

				let j = i + 1;
				let closed = false;
				while (j < lines.length) {
					const closeMatch = lines[j].match(/^ {0,3}(`{3,}|~{3,})\s*$/);
					if (closeMatch && closeMatch[1][0] === fenceChar && closeMatch[1].length >= fenceLen) {
						closed = true;
						break;
					}

					const codeLine = lines[j];
					if (codeLine.length > 0) {
						rawOps.push({ insert: codeLine });
					}
					rawOps.push({ insert: "\n", attributes: { "code-block": true } });
					j++;
				}

				i = closed ? j + 1 : lines.length;
				continue;
			}
		}

		// 2. Table Block (render as aligned code block for perfect column alignment)
		if (line.includes("|") && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
			indentTracker.reset();
			const tableLines: string[] = [];
			let j = i;
			while (j < lines.length && lines[j].trim().includes("|") && lines[j].trim() !== "") {
				tableLines.push(lines[j]);
				j++;
			}

			const aligned = formatAlignedTable(tableLines);
			for (const tableLine of aligned.split("\n")) {
				if (tableLine.length > 0) {
					rawOps.push({ insert: tableLine });
				}
				rawOps.push({ insert: "\n", attributes: { "code-block": true } });
			}
			i = j;
			continue;
		}

		// 3. Callout / Blockquote
		if (line.match(/^>\s?/)) {
			indentTracker.reset();
			// Check for Callout header on the first quote line
			const calloutMatch = line.match(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/);
			if (calloutMatch) {
				const label = calloutMatch[2].trim() || calloutMatch[1].toUpperCase();
				rawOps.push({ insert: `[${label}]`, attributes: { bold: true } });
				rawOps.push({ insert: "\n", attributes: { blockquote: true } });
				i++;
				continue;
			}

			// Standard Blockquote line
			const quoteContent = line.replace(/^>\s?/, "");
			if (quoteContent.length > 0) {
				rawOps.push(...parseInlineToOps(quoteContent));
			}
			rawOps.push({ insert: "\n", attributes: { blockquote: true } });
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
			if (isChecked) {
				rawOps.push(...parseInlineToOps(text, { strike: true }));
			} else {
				rawOps.push(...parseInlineToOps(text));
			}

			const listAttrs: Record<string, any> = { list: "bullet" };
			if (indent > 0) listAttrs.indent = indent;
			rawOps.push({ insert: "\n", attributes: listAttrs });
			i++;
			continue;
		}

		// 5. Bullet List (- item, * item, + item)
		const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
		if (bulletMatch) {
			const indent = indentTracker.getLevel(bulletMatch[1]);
			const text = bulletMatch[2];

			rawOps.push(...parseInlineToOps(text));
			const listAttrs: Record<string, any> = { list: "bullet" };
			if (indent > 0) listAttrs.indent = indent;
			rawOps.push({ insert: "\n", attributes: listAttrs });
			i++;
			continue;
		}

		// 6. Ordered List (1. item)
		const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
		if (orderedMatch) {
			const indent = indentTracker.getLevel(orderedMatch[1]);
			const text = orderedMatch[2];

			rawOps.push(...parseInlineToOps(text));
			const listAttrs: Record<string, any> = { list: "ordered" };
			if (indent > 0) listAttrs.indent = indent;
			rawOps.push({ insert: "\n", attributes: listAttrs });
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
