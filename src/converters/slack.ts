import {
	BOLD_MARK,
	CODE_MARK,
	UNDERLINE_MARK,
	escapeHtml,
	extractCodeBlocks,
	isSafeUrl,
	resolveWikilinks,
	restoreCodeBlocks,
} from "./common";

interface ListLine {
	indent: number;
	tag: "ul" | "ol";
	content: string;
}

function indentWidth(raw: string): number {
	return raw.replace(/\t/g, "    ").length;
}

function formatInlineSlackHtml(line: string): string {
	const underlineBlocks: string[] = [];
	let text = line.replace(/<u>([\s\S]*?)<\/u>/gi, (_match, inner) => {
		underlineBlocks.push(inner);
		return `${UNDERLINE_MARK}${underlineBlocks.length - 1}${UNDERLINE_MARK}`;
	});

	text = escapeHtml(text);
	text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
	text = text.replace(/(\*\*|__)(.+?)\1/g, "<b>$2</b>");
	text = text.replace(/(\*|_)(.+?)\1/g, "<i>$2</i>");
	text = text.replace(/~~(.+?)~~/g, "<s>$1</s>");
	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, title, url) => {
		const cleanUrl = url.trim();
		if (isSafeUrl(cleanUrl)) {
			return `<a href="${cleanUrl}">${title}</a>`;
		}
		return title;
	});

	const underlinePattern = new RegExp(`${UNDERLINE_MARK}(\\d+)${UNDERLINE_MARK}`, "g");
	text = text.replace(underlinePattern, (_match, i) => `<u>${escapeHtml(underlineBlocks[Number(i)])}</u>`);

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

/**
 * Converts Markdown to Slack mrkdwn plain text.
 */
export function convertToSlack(md: string): string {
	let text = resolveWikilinks(md);

	// Remove <u>...</u> HTML tags
	text = text.replace(/<u>([\s\S]*?)<\/u>/gi, "$1");

	// Convert checkboxes (task lists)
	text = text.replace(/^(\s*)[-*+]\s+\[ \]\s+/gm, "$1☐ ");
	text = text.replace(/^(\s*)[-*+]\s+\[[xX]\]\s+/gm, "$1☑ ");

	// Extract code blocks
	const extraction = extractCodeBlocks(
		text,
		(code) => "```\n" + code + "\n```",
		(code) => "`" + code + "`"
	);
	text = extraction.text;
	const codeBlocks = extraction.blocks;

	// Stash remaining inline code
	text = text.replace(/`([^`]+)`/g, (match) => {
		codeBlocks.push(match);
		return `${CODE_MARK}${codeBlocks.length - 1}${CODE_MARK}`;
	});

	// Stash headings, bold (**/__), and Callout titles
	const boldTargets: string[] = [];

	// Stash Callouts (e.g. > [!NOTE] content)
	text = text.replace(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/gm, (_match, type, title) => {
		const label = title.trim() || type.toUpperCase();
		boldTargets.push(`[${label}]`);
		return `> ${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	text = text.replace(/^#{1,6}\s+(.*)$/gm, (_match, content) => {
		boldTargets.push(content);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});
	text = text.replace(/(\*\*|__)(.+?)\1/g, (_match, _marker, content) => {
		boldTargets.push(content);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// Italics (* / _)
	text = text.replace(/(\*|_)(.+?)\1/g, "_$2_");

	// Restore bold to Slack *text* format
	const boldPattern = new RegExp(`${BOLD_MARK}(\\d+)${BOLD_MARK}`, "g");
	text = text.replace(boldPattern, (_match, i) => `*${boldTargets[Number(i)]}*`);

	// Strikethrough, links, and bullet points
	text = text.replace(/~~(.+?)~~/g, "~$1~");
	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, title, url) => {
		const cleanUrl = url.trim();
		if (isSafeUrl(cleanUrl)) {
			return `<${cleanUrl}|${title}>`;
		}
		return title;
	});
	text = text.replace(/^[-*+]\s+/gm, "• ");

	text = restoreCodeBlocks(text, codeBlocks);

	return text.trim();
}

/**
 * Converts Markdown to Slack rich-text HTML.
 */
export function convertToSlackHtml(md: string): string {
	let text = resolveWikilinks(md);

	// Callout (e.g. > [!NOTE] content)
	text = text.replace(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/gm, (_match, type, title) => {
		const label = title.trim() || type.toUpperCase();
		return `> **[${label}]**`;
	});

	// Adjust Markdown task list syntax for HTML conversion
	text = text.replace(/^(\s*)[-*+]\s+\[ \]\s+(.*)$/gm, "$1- ☐ $2");
	text = text.replace(/^(\s*)[-*+]\s+\[[xX]\]\s+(.*)$/gm, "$1- ☑ ~~$2~~");

	const extraction = extractCodeBlocks(
		text,
		(code) =>
			code
				.split("\n")
				.map(
					(line) =>
						`<p style="margin: 0.0px; font-family: monospace;"><span style="font-family: monospace;">${escapeHtml(line) || "&nbsp;"}</span></p>`
				)
				.join(""),
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
			htmlParts.push({ html: `<b>${formatInlineSlackHtml(heading[1])}</b>`, kind: "inline" });
			i++;
		} else if (quoteMatch) {
			const quoteLines: string[] = [];
			let j = i;
			while (j < lines.length) {
				const m = lines[j].match(/^>\s?(.*)$/);
				if (!m) break;
				quoteLines.push(formatInlineSlackHtml(m[1]));
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
					content: formatInlineSlackHtml(m[3]),
				});
				j++;
			}
			const minIndent = Math.min(...listLines.map((l) => l.indent));
			const [html] = buildNestedListHtml(listLines, 0, minIndent);
			htmlParts.push({ html, kind: "list" });
			i = j;
		} else {
			htmlParts.push({ html: formatInlineSlackHtml(line), kind: "inline" });
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
