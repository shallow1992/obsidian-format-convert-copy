import { resolveWikilinks } from "./common";

export interface DeltaOp {
	insert: string;
	attributes?: Record<string, any>;
}

export interface SlackTextyResult {
	texty: string;
	markdown: string;
	plain: string;
}

interface BlockItem {
	type: "code" | "text";
	content: string;
	lang?: string;
}

/**
 * Parses markdown into code block items and plain text items.
 */
function parseBlocks(source: string): BlockItem[] {
	const lines = source.split("\n");
	const items: BlockItem[] = [];
	let currentTextLines: string[] = [];
	let i = 0;

	const flushText = () => {
		if (currentTextLines.length > 0) {
			items.push({
				type: "text",
				content: currentTextLines.join("\n"),
			});
			currentTextLines = [];
		}
	};

	while (i < lines.length) {
		const line = lines[i];
		const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);

		if (fenceMatch) {
			const fenceStr = fenceMatch[1];
			const fenceChar = fenceStr[0];
			const fenceLen = fenceStr.length;
			const lang = fenceMatch[2].trim();

			if (!(fenceChar === "`" && lang.includes("`"))) {
				flushText();
				const codeLines: string[] = [];
				let j = i + 1;
				let closed = false;

				while (j < lines.length) {
					const closeMatch = lines[j].match(/^ {0,3}(`{3,}|~{3,})\s*$/);
					if (closeMatch && closeMatch[1][0] === fenceChar && closeMatch[1].length >= fenceLen) {
						closed = true;
						break;
					}
					codeLines.push(lines[j]);
					j++;
				}

				items.push({
					type: "code",
					content: codeLines.join("\n"),
					lang: lang || undefined,
				});

				i = closed ? j + 1 : lines.length;
				continue;
			}
		}

		currentTextLines.push(line);
		i++;
	}

	flushText();
	return items;
}

/**
 * Parses an inline text segment into Delta operations.
 * Handles inline code (`code`), bold (**bold**), italic (*italic* / _italic_),
 * strikethrough (~~strike~~), and links ([title](url)).
 */
function parseInlineToOps(text: string): DeltaOp[] {
	const ops: DeltaOp[] = [];

	// Tokenize inline styles
	// Patterns:
	// 1. Inline code: `...`
	// 2. Bold: **...** or __...__
	// 3. Italic: *...* or _..._
	// 4. Strikethrough: ~~...~~
	// 5. Link: [...](...)
	const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_)|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;

	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = tokenRegex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			ops.push({ insert: text.slice(lastIndex, match.index) });
		}

		const token = match[0];
		if (token.startsWith("`") && token.endsWith("`")) {
			ops.push({
				insert: token.slice(1, -1),
				attributes: { code: true },
			});
		} else if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
			ops.push({
				insert: token.slice(2, -2),
				attributes: { bold: true },
			});
		} else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
			ops.push({
				insert: token.slice(1, -1),
				attributes: { italic: true },
			});
		} else if (token.startsWith("~~") && token.endsWith("~~")) {
			ops.push({
				insert: token.slice(2, -2),
				attributes: { strike: true },
			});
		} else if (token.startsWith("[") && token.includes("](")) {
			const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
			if (linkMatch) {
				ops.push({
					insert: linkMatch[1],
					attributes: { link: linkMatch[2].trim() },
				});
			} else {
				ops.push({ insert: token });
			}
		} else {
			ops.push({ insert: token });
		}

		lastIndex = match.index + token.length;
	}

	if (lastIndex < text.length) {
		ops.push({ insert: text.slice(lastIndex) });
	}

	return ops;
}

/**
 * Converts Markdown into Slack native clipboard representations:
 * 1. `slack/texty`: Quill Delta JSON (`{"ops": [...]}`)
 * 2. `text/markdown`: Standard fenced Markdown
 * 3. `text/plain`: Plain text format
 */
export function convertToSlackTexty(source: string): SlackTextyResult {
	const resolvedSource = resolveWikilinks(source);
	const blocks = parseBlocks(resolvedSource);

	const ops: DeltaOp[] = [];
	const markdownParts: string[] = [];
	const plainParts: string[] = [];

	for (const block of blocks) {
		if (block.type === "code") {
			// 1. slack/texty ops for code block
			if (block.lang) {
				ops.push({ insert: block.lang });
				ops.push({ insert: "\n", attributes: { "code-block": true } });
			}

			const codeLines = block.content.split("\n");
			for (const line of codeLines) {
				if (line.length > 0) {
					ops.push({ insert: line });
				}
				ops.push({ insert: "\n", attributes: { "code-block": true } });
			}

			// 2. text/markdown representation
			if (block.lang) {
				markdownParts.push(`\`\`\`\n${block.lang}\n${block.content}\n\`\`\``);
			} else {
				markdownParts.push(`\`\`\`\n${block.content}\n\`\`\``);
			}

			// 3. text/plain representation
			if (block.lang) {
				plainParts.push(`${block.lang}\n${block.content}`);
			} else {
				plainParts.push(block.content);
			}
		} else {
			// Ordinary text block
			const lines = block.content.split("\n");
			for (let idx = 0; idx < lines.length; idx++) {
				const line = lines[idx];
				const inlineOps = parseInlineToOps(line);
				ops.push(...inlineOps);

				// Add newline for all lines except the very last if trailing
				if (idx < lines.length - 1 || line.length > 0) {
					ops.push({ insert: "\n" });
				}
			}

			markdownParts.push(block.content);
			plainParts.push(block.content);
		}
	}

	const textyJson = JSON.stringify({ ops });
	const markdown = markdownParts.join("\n\n").trim();
	const plain = plainParts.join("\n\n").trim();

	return {
		texty: textyJson,
		markdown,
		plain,
	};
}
