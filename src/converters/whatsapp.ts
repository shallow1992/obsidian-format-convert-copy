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
	let text = resolveWikilinks(md);

	// Strip <u>...</u> tags since WhatsApp has no underline syntax
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

	// Convert headings to bold
	text = text.replace(/^#{1,6}\s+(.*)$/gm, (_match, content) => {
		boldTargets.push(content);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// Bold (**)
	text = text.replace(/(\*\*|__)(.+?)\1/g, (_match, _marker, content) => {
		boldTargets.push(content);
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
