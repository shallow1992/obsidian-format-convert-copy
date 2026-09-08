import { extractCodeBlocks, resolveWikilinks, restoreCodeBlocks } from "./common";

/**
 * Converts Markdown to Discord format.
 */
export function convertToDiscord(md: string): string {
	// Normalize CRLF to LF
	let text = md.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	text = resolveWikilinks(text);

	// Normalize Setext headings (e.g. Title\n=== or Title\n---)
	text = text.replace(/^([^\n#>`\-*+~_\t][^\n]*)\n={2,}\s*$/gm, "# $1");
	text = text.replace(/^([^\n#>`\-*+~_\t][^\n]*)\n-{2,}\s*$/gm, "## $1");

	// Extract and protect code blocks & tables
	const extraction = extractCodeBlocks(
		text,
		(code) => "```\n" + code + "\n```",
		(code) => "`" + code + "`"
	);
	text = extraction.text;
	const codeBlocks = extraction.blocks;

	// In Discord, __text__ renders as underline; unify standard Markdown bold (__text__) into **text**
	text = text.replace(/__(.+?)__/g, "**$1**");

	// Convert <u>...</u> to Discord underline syntax (__text__)
	text = text.replace(/<u>([\s\S]*?)<\/u>/gi, "__$1__");

	// Callout (e.g. > [!NOTE] content)
	text = text.replace(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/gm, (_match, type, title) => {
		const label = title.trim() || type.toUpperCase();
		return `> **[${label}]**`;
	});

	// Convert checkboxes (task lists)
	// Use strikethrough in Discord to clearly denote completed tasks
	text = text.replace(/^(\s*)[-*+]\s+\[ \]\s+(.*)$/gm, "$1☐ $2");
	text = text.replace(/^(\s*)[-*+]\s+\[[xX]\]\s+(.*)$/gm, "$1☑ ~~$2~~");

	text = restoreCodeBlocks(text, codeBlocks);

	return text.trim();
}

