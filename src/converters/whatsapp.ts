import {
	BOLD_MARK,
	CODE_MARK,
	extractCodeBlocks,
	isSafeUrl,
	resolveWikilinks,
	restoreCodeBlocks,
} from "./common";

/**
 * Converts Markdown to WhatsApp format.
 * WhatsApp formatting rules:
 * - Bold: *text*
 * - Italic: _text_
 * - Strikethrough: ~text~
 * - Monospace / Code: ```code``` or `inline`
 * - Blockquote: > quote
 * - Bullet points: - or * or •
 * - Links: WhatsApp does not interpret [title](url) Markdown links; expand to title (url) or url
 */
export function convertToWhatsApp(md: string): string {
	// Normalize CRLF to LF
	let text = md.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	text = resolveWikilinks(text);

	// Strip <u>...</u> tags since WhatsApp has no underline syntax
	text = text.replace(/<u>([\s\S]*?)<\/u>/gi, "$1");

	// Normalize Setext headings (e.g. Title\n=== or Title\n---)
	text = text.replace(/^([^\n#>`\-*+~_\t][^\n]*)\n={2,}\s*$/gm, "# $1");
	text = text.replace(/^([^\n#>`\-*+~_\t][^\n]*)\n-{2,}\s*$/gm, "## $1");

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

	// Convert ATX headings (with optional 1-3 leading spaces and trailing closing hashes)
	text = text.replace(/^[ \t]*#{1,6}\s+(.*?)(?:\s+#+)?\s*$/gm, (_match, content) => {
		let clean = content.trim().replace(/^(\*\*|__)(.+?)\1$/, "$2");
		clean = clean.replace(/(\*|_)(.+?)\1/g, "_$2_");
		clean = clean.replace(/~~(.+?)~~/g, "~$1~");
		boldTargets.push(clean);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// Bold (**/__)
	text = text.replace(/(\*\*|__)(.+?)\1/g, (_match, _marker, content) => {
		let clean = content.trim();
		clean = clean.replace(/(\*|_)(.+?)\1/g, "_$2_");
		clean = clean.replace(/~~(.+?)~~/g, "~$1~");
		boldTargets.push(clean);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// Italics (* / _)
	text = text.replace(/(\*|_)(.+?)\1/g, "_$2_");

	// Restore bold to WhatsApp *text* format
	const boldPattern = new RegExp(`${BOLD_MARK}(\\d+)${BOLD_MARK}`, "g");
	text = text.replace(boldPattern, (_match, i) => `*${boldTargets[Number(i)]}*`);

	// Strikethrough (~~)
	text = text.replace(/~~(.+?)~~/g, "~$1~");

	// Convert [title](url) -> title (url) or url (safe URLs only)
	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, title, url) => {
		const cleanUrl = url.trim();
		if (!isSafeUrl(cleanUrl)) {
			return title;
		}
		if (title.trim() === cleanUrl) return cleanUrl;
		return `${title} (${cleanUrl})`;
	});

	text = restoreCodeBlocks(text, codeBlocks);

	return text.trim();
}
