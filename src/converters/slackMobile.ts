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
const LINK_MARK = "\uE004";
const NBSP = "\u00A0";
const EMPTY_LINE_HTML = "<p>&nbsp;</p>";
const HR_HTML = "<p>───</p>";

// Pre-compiled regular expressions for line categorization
const CODE_PLACEHOLDER_REGEX = new RegExp(`^${CODE_MARK}(\\d+)${CODE_MARK}$`);
const HEADING_REGEX = /^#{1,6}\s+(.*)$/;
const LIST_REGEX = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;
const QUOTE_REGEX = /^>\s?(.*)$/;
const HR_REGEX = /^(?:---+|\*\*\*+|___+)\s*$/;
const CALLOUT_REGEX = /^>[ \t]*\[!([A-Za-z]+)\][ \t]*(.*)$/gm;
const TASK_UNCHECKED_REGEX = /^(\s*)[-*+]\s+\[ \]\s+(.*)$/gm;
const TASK_CHECKED_REGEX = /^(\s*)[-*+]\s+\[[xX]\]\s+(.*)$/gm;

interface ListLine {
	indent: number;
	tag: "ul" | "ol";
	content: string;
}

function indentWidth(raw: string): number {
	return raw.replace(/\t/g, "    ").length;
}

function isBlockStart(line: string): boolean {
	return (
		CODE_PLACEHOLDER_REGEX.test(line) ||
		HEADING_REGEX.test(line) ||
		LIST_REGEX.test(line) ||
		QUOTE_REGEX.test(line) ||
		HR_REGEX.test(line)
	);
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

	// 3. Extract hyperlinks (protect URLs containing _ or * from italic/bold formatting)
	const linkBlocks: string[] = [];
	text = text.replace(/\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g, (_match, title, url) => {
		const cleanUrl = url.trim();
		if (isSafeUrl(cleanUrl)) {
			const formattedTitle = formatInlineSlackMobileHtml(title, depth + 1);
			linkBlocks.push(`<a href="${escapeHtml(cleanUrl)}">${formattedTitle}</a>`);
			return `${LINK_MARK}${linkBlocks.length - 1}${LINK_MARK}`;
		}
		return title;
	});

	// 4. Escape HTML special characters
	text = escapeHtml(text);

	// 5. Combined Bold + Italic (***text*** or ___text___)
	text = text.replace(/(\*\*\*|___)(.+?)\1/g, "<b><i>$2</i></b>");

	// 6. Bold: **text** or __text__
	text = text.replace(/(\*\*|__)(.+?)\1/g, "<b>$2</b>");

	// 7. Italic: *text* or _text_
	text = text.replace(/(\*|_)(.+?)\1/g, "<i>$2</i>");

	// 8. Strikethrough: ~~text~~
	text = text.replace(/~~(.+?)~~/g, "<s>$1</s>");

	// 9. Restore <u> tags with recursive formatting of inner content
	const underlinePattern = new RegExp(`${UNDERLINE_MARK}(\\d+)${UNDERLINE_MARK}`, "g");
	text = text.replace(underlinePattern, (_match, i) => {
		const innerContent = underlineBlocks[Number(i)];
		return `<u>${formatInlineSlackMobileHtml(innerContent, depth + 1)}</u>`;
	});

	// 10. Restore hyperlinks
	if (linkBlocks.length > 0) {
		const linkPattern = new RegExp(`${LINK_MARK}(\\d+)${LINK_MARK}`, "g");
		text = text.replace(linkPattern, (_match, i) => linkBlocks[Number(i)]);
	}

	// 11. Restore inline code if any was extracted locally
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

function formatSlackMobileCodeBlockHtml(code: string, lang?: string): string {
	const openFence = lang ? `\`\`\`${escapeHtml(lang)}` : "```";
	const lines = code.split("\n").map((line) => {
		let content = escapeHtml(line);
		content = content.replace(/^( +)/, (_match, spaces) => "&nbsp;".repeat(spaces.length));
		return content || "&nbsp;";
	});
	return `<p>${openFence}<br>${lines.join("<br>")}<br>\`\`\`</p>`;
}

function parseQuoteBlock(lines: string[], startIndex: number): { html: string; nextIndex: number } {
	const quoteLines: string[] = [];
	let j = startIndex;
	while (j < lines.length) {
		const m = lines[j].match(QUOTE_REGEX);
		if (!m) break;
		const content = formatInlineSlackMobileHtml(m[1]);
		quoteLines.push(content ? `&gt; ${content}` : "&gt;");
		j++;
	}
	return {
		html: `<p>${quoteLines.join("<br>")}</p>`,
		nextIndex: j,
	};
}

function parseListBlock(lines: string[], startIndex: number): { html: string; nextIndex: number } {
	const listLines: ListLine[] = [];
	let j = startIndex;
	while (j < lines.length) {
		const m = lines[j].match(LIST_REGEX);
		if (!m) break;
		listLines.push({
			indent: indentWidth(m[1]),
			tag: /\d+\./.test(m[2]) ? "ol" : "ul",
			content: formatInlineSlackMobileHtml(m[3]),
		});
		j++;
	}
	const minIndent = Math.min(...listLines.map((l) => l.indent));
	const [listHtml] = buildNestedListHtml(listLines, 0, minIndent);
	return {
		html: listHtml,
		nextIndex: j,
	};
}

function parseParagraphBlock(lines: string[], startIndex: number): { html: string; nextIndex: number } {
	const paraLines: string[] = [formatInlineSlackMobileHtml(lines[startIndex])];
	let j = startIndex + 1;
	while (j < lines.length && lines[j].trim() !== "" && !isBlockStart(lines[j])) {
		paraLines.push(formatInlineSlackMobileHtml(lines[j]));
		j++;
	}
	return {
		html: `<p>${paraLines.join("<br>")}</p>`,
		nextIndex: j,
	};
}

function countTrailingEmptyLines(lines: string[], startIndex: number): { emptyCount: number; nextIndex: number } {
	let count = 0;
	let j = startIndex;
	while (j < lines.length && lines[j].trim() === "") {
		count++;
		j++;
	}
	return {
		emptyCount: count,
		nextIndex: j,
	};
}

/**
 * Converts Markdown to Slack rich-text HTML tailored for mobile (iOS / Android) pasteboards.
 */
export function convertToSlackMobileHtml(md: string): string {
	let text = resolveWikilinks(md);

	// Callout conversion (e.g. > [!NOTE] content)
	text = text.replace(CALLOUT_REGEX, (_match, type, title) => {
		const label = title.trim() || type.toUpperCase();
		return `> **[${label}]**`;
	});

	// Adjust Markdown task list syntax for HTML conversion
	text = text.replace(TASK_UNCHECKED_REGEX, "$1- ☐ $2");
	text = text.replace(TASK_CHECKED_REGEX, "$1- ☑ ~~$2~~");

	const extraction = extractCodeBlocks(
		text,
		(code, lang) => formatSlackMobileCodeBlockHtml(code, lang),
		(code) => `<code>${escapeHtml(code)}</code>`,
		(math) => {
			const lines = math.split("\n").map((line) => {
				let content = escapeHtml(line);
				content = content.replace(/^( +)/, (_match, spaces) => "&nbsp;".repeat(spaces.length));
				return content || "&nbsp;";
			});
			return `<p>$$<br>${lines.join("<br>")}<br>$$</p>`;
		},
		(math) => `$${escapeHtml(math)}$`
	);
	text = extraction.text;
	const codeBlocks = extraction.blocks;

	const parts: string[] = [];
	const lines = text.split("\n");
	let i = 0;

	// Skip leading empty lines at the very start of the document
	while (i < lines.length && lines[i].trim() === "") {
		i++;
	}

	while (i < lines.length) {
		const line = lines[i];
		const codePlaceholder = line.match(CODE_PLACEHOLDER_REGEX);
		const heading = line.match(HEADING_REGEX);
		const hrMatch = line.match(HR_REGEX);
		const quoteMatch = line.match(QUOTE_REGEX);
		const listMatch = line.match(LIST_REGEX);

		let html = "";

		if (codePlaceholder) {
			html = codeBlocks[Number(codePlaceholder[1])];
			i++;
		} else if (heading) {
			html = `<p><b>${formatInlineSlackMobileHtml(heading[1])}</b></p>`;
			i++;
		} else if (hrMatch) {
			html = HR_HTML;
			i++;
		} else if (quoteMatch) {
			const parsed = parseQuoteBlock(lines, i);
			html = parsed.html;
			i = parsed.nextIndex;
		} else if (listMatch) {
			const parsed = parseListBlock(lines, i);
			html = parsed.html;
			i = parsed.nextIndex;
		} else {
			const parsed = parseParagraphBlock(lines, i);
			html = parsed.html;
			i = parsed.nextIndex;
		}

		parts.push(html);

		// Count any subsequent empty lines as trailing empty lines
		const { emptyCount, nextIndex } = countTrailingEmptyLines(lines, i);
		i = nextIndex;

		// If not at the end of the document, emit <p>&nbsp;</p> for each empty line.
		// &nbsp; (U+00A0) prevents Slack mobile's paste normalizer from collapsing empty paragraphs.
		if (i < lines.length) {
			for (let k = 0; k < emptyCount; k++) {
				parts.push(EMPTY_LINE_HTML);
			}
		}
	}

	let result = parts.join("");
	result = restoreCodeBlocks(result, codeBlocks);
	return result.trim();
}

