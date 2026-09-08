import {
	CODE_MARK,
	UNDERLINE_MARK,
	escapeHtml,
	extractCodeBlocks,
	isSafeUrl,
	resolveWikilinks,
	restoreCodeBlocks,
} from "./common";

const INLINE_CODE_MARK = "\uE003";

interface ListLine {
	indent: number;
	tag: "ul" | "ol";
	content: string;
}

function indentWidth(raw: string): number {
	return raw.replace(/\t/g, "    ").length;
}

/**
 * Formats inline Markdown into HTML safe for Slack iOS / mobile rich-text input.
 */
export function formatInlineSlackMobileHtml(line: string, depth = 0): string {
	if (!line) return "";
	if (depth > 3) return escapeHtml(line);

	// 1. Extract inline code (if called directly, e.g. in unit tests)
	const inlineCodeBlocks: string[] = [];
	let text = line;
	if (text.includes("`")) {
		text = text.replace(/`([^`]+)`/g, (_match, code) => {
			inlineCodeBlocks.push(`<code>${escapeHtml(code)}</code>`);
			return `${INLINE_CODE_MARK}${inlineCodeBlocks.length - 1}${INLINE_CODE_MARK}`;
		});
	}

	// 2. Extract <u> tags (protect raw HTML from escapeHtml)
	const underlineBlocks: string[] = [];
	text = text.replace(/<u>([\s\S]*?)<\/u>/gi, (_match, inner) => {
		underlineBlocks.push(inner);
		return `${UNDERLINE_MARK}${underlineBlocks.length - 1}${UNDERLINE_MARK}`;
	});

	// 3. Escape HTML special characters
	text = escapeHtml(text);

	// 4. Combined Bold + Italic (***text*** or ___text___)
	text = text.replace(/(\*\*\*|___)(.+?)\1/g, "<b><i>$2</i></b>");

	// 5. Bold: **text** or __text__
	text = text.replace(/(\*\*|__)(.+?)\1/g, "<b>$2</b>");

	// 6. Italic: *text* or _text_
	text = text.replace(/(\*|_)(.+?)\1/g, "<i>$2</i>");

	// 7. Strikethrough: ~~text~~
	text = text.replace(/~~(.+?)~~/g, "<s>$1</s>");

	// 8. Hyperlinks: [title](url) supporting balanced parentheses in URLs
	text = text.replace(/\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g, (_match, title, url) => {
		const cleanUrl = url.trim();
		if (isSafeUrl(cleanUrl)) {
			return `<a href="${cleanUrl}">${title}</a>`;
		}
		return title;
	});

	// 9. Restore <u> tags with recursive formatting of inner content
	const underlinePattern = new RegExp(`${UNDERLINE_MARK}(\\d+)${UNDERLINE_MARK}`, "g");
	text = text.replace(underlinePattern, (_match, i) => {
		const innerContent = underlineBlocks[Number(i)];
		return `<u>${formatInlineSlackMobileHtml(innerContent, depth + 1)}</u>`;
	});

	// 10. Restore inline code if any was extracted locally
	if (inlineCodeBlocks.length > 0) {
		const codePattern = new RegExp(`${INLINE_CODE_MARK}(\\d+)${INLINE_CODE_MARK}`, "g");
		text = text.replace(codePattern, (_match, i) => inlineCodeBlocks[Number(i)]);
	}

	return text;
}

function buildNestedListHtml(lines: ListLine[], startIndex: number, minIndent: number): [string, number] {
	let i = startIndex;
	let html = "";
	let currentTag: "ul" | "ol" | null = null;
	let buffer: string[] = [];

	const flush = () => {
		if (currentTag && buffer.length > 0) {
			html += `<${currentTag}>${buffer.join("")}</${currentTag}>`;
		}
		buffer = [];
	};

	while (i < lines.length && lines[i].indent >= minIndent) {
		if (lines[i].indent > minIndent) {
			const [nestedHtml, nextIndex] = buildNestedListHtml(lines, i, lines[i].indent);
			if (buffer.length > 0) {
				buffer[buffer.length - 1] = buffer[buffer.length - 1].replace(/<\/li>$/, `${nestedHtml}</li>`);
			}
			i = nextIndex;
			continue;
		}

		if (currentTag && currentTag !== lines[i].tag) {
			flush();
		}
		currentTag = lines[i].tag;
		buffer.push(`<li>${lines[i].content}</li>`);
		i++;
	}
	flush();

	return [html, i];
}

function formatSlackMobileCodeBlockHtml(code: string): string {
	return `<pre><code>${escapeHtml(code)}</code></pre>`;
}

/**
 * Converts Markdown to Slack rich-text HTML tailored for mobile (iOS / Android) pasteboards.
 */
export function convertToSlackMobileHtml(md: string): string {
	let text = resolveWikilinks(md);

	// Callout conversion (e.g. > [!NOTE] content)
	text = text.replace(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/gm, (_match, type, title) => {
		const label = title.trim() || type.toUpperCase();
		return `> **[${label}]**`;
	});

	// Adjust Markdown task list syntax for HTML conversion
	text = text.replace(/^(\s*)[-*+]\s+\[ \]\s+(.*)$/gm, "$1- ☐ $2");
	text = text.replace(/^(\s*)[-*+]\s+\[[xX]\]\s+(.*)$/gm, "$1- ☑ ~~$2~~");

	const extraction = extractCodeBlocks(
		text,
		(code) => formatSlackMobileCodeBlockHtml(code),
		(code) => `<code>${escapeHtml(code)}</code>`
	);
	text = extraction.text;
	const codeBlocks = extraction.blocks;

	type PartKind = "code" | "quote" | "list" | "inline";
	const htmlParts: { html: string; kind: PartKind }[] = [];
	const lines = text.split("\n");
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		const codePlaceholder = line.match(new RegExp(`^${CODE_MARK}(\\d+)${CODE_MARK}$`));
		const heading = line.match(/^#{1,6}\s+(.*)$/);
		const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
		const quoteMatch = line.match(/^>\s?(.*)$/);

		if (codePlaceholder) {
			htmlParts.push({ html: codeBlocks[Number(codePlaceholder[1])], kind: "code" });
			i++;
		} else if (heading) {
			htmlParts.push({ html: `<b>${formatInlineSlackMobileHtml(heading[1])}</b>`, kind: "inline" });
			i++;
		} else if (quoteMatch) {
			const quoteLines: string[] = [];
			let j = i;
			while (j < lines.length) {
				const m = lines[j].match(/^>\s?(.*)$/);
				if (!m) break;
				quoteLines.push(formatInlineSlackMobileHtml(m[1]));
				j++;
			}
			htmlParts.push({ html: `<blockquote>${quoteLines.join("<br>")}</blockquote>`, kind: "quote" });
			i = j;
		} else if (listMatch) {
			const listLines: ListLine[] = [];
			let j = i;
			while (j < lines.length) {
				const m = lines[j].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
				if (!m) break;
				listLines.push({
					indent: indentWidth(m[1]),
					tag: /\d+\./.test(m[2]) ? "ol" : "ul",
					content: formatInlineSlackMobileHtml(m[3]),
				});
				j++;
			}
			const minIndent = Math.min(...listLines.map((l) => l.indent));
			const [html] = buildNestedListHtml(listLines, 0, minIndent);
			htmlParts.push({ html, kind: "list" });
			i = j;
		} else {
			htmlParts.push({ html: formatInlineSlackMobileHtml(line), kind: "inline" });
			i++;
		}
	}

	let result = "";
	for (let idx = 0; idx < htmlParts.length; idx++) {
		result += htmlParts[idx].html;
		const next = htmlParts[idx + 1];
		if (!next) continue;

		const bothInline = htmlParts[idx].kind === "inline" && next.kind === "inline";
		const bothCode = htmlParts[idx].kind === "code" && next.kind === "code";
		if (bothInline || bothCode) {
			result += "<br>";
		}
	}

	result = restoreCodeBlocks(result, codeBlocks);
	return result.trim();
}
