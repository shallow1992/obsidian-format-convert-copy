import {
	BOLD_MARK,
	CODE_MARK,
	extractCodeBlocks,
	isSafeUrl,
	resolveWikilinks,
	restoreCodeBlocks,
} from "./common";

const URL_MARK = "\uE003";

/**
 * Normalizes inner markdown formatting within a heading to prevent conflicting delimiters
 * when the entire heading is wrapped with WhatsApp bold (*Heading*).
 */
function sanitizeHeadingContent(content: string): string {
	let res = content;
	// Strip bold delimiters (**text** or __text__) since the entire heading is already bold
	res = res.replace(/(\*\*|__)(.+?)\1/g, "$2");
	// Unify italic asterisks (*italic*) into underscores (_italic_) to prevent nested asterisk collisions
	res = res.replace(/(^|[^*])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?!\*)/g, "$1_$2_");
	return res;
}

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

	// Extract code blocks, tables, and LaTeX math
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

	// Protect URLs (both Markdown links and raw URLs) to prevent underscores or asterisks
	// inside URLs from being mutated by inline formatting regexes.
	const urls: string[] = [];

	// 1. Expand Markdown links: [title](url) -> title (url)
	text = text.replace(/\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g, (_match: string, title: string, rawUrl: string) => {
		const cleanUrl = rawUrl.trim();
		if (!isSafeUrl(cleanUrl)) {
			return title;
		}
		urls.push(cleanUrl);
		const urlPlaceholder = `${URL_MARK}${urls.length - 1}${URL_MARK}`;
		if (title.trim() === cleanUrl) {
			return urlPlaceholder;
		}
		return `${title} (${urlPlaceholder})`;
	});

	// 2. Protect standalone raw URLs (http://, https://, etc.)
	text = text.replace(/\bhttps?:\/\/[^\s<>"'`)]+/g, (match: string) => {
		urls.push(match);
		return `${URL_MARK}${urls.length - 1}${URL_MARK}`;
	});

	// Stash headings, bold (**/__), and Callouts
	const boldTargets: string[] = [];

	// Convert Callouts:
	// > [!NOTE] Title -> > *[NOTE]* Title
	// > [!NOTE] -> > *[NOTE]*
	text = text.replace(/^>[ \t]*\[!([A-Za-z]+)\][ \t]*(.*)$/gm, (_match: string, type: string, rawTitle: string) => {
		const upperType = type.toUpperCase();
		const title = rawTitle.trim();
		boldTargets.push(`[${upperType}]`);
		const badge = `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
		return title ? `> ${badge} ${title}` : `> ${badge}`;
	});

	// Convert headings to WhatsApp bold (*Heading*) with internal sanitization
	text = text.replace(/^#{1,6}\s+(.*)$/gm, (_match: string, content: string) => {
		const sanitized = sanitizeHeadingContent(content.trim());
		boldTargets.push(sanitized);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// Bold (**) and (__)
	// 1. Double asterisk bold: **text**
	text = text.replace(/\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*/g, (_match: string, content: string) => {
		boldTargets.push(content);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});
	// 2. Double underscore bold: __text__ (boundary-checked without lookbehind)
	text = text.replace(/(^|[\s\p{P}])__([^\s_](?:[\s\S]*?[^\s_])?)__(?=[\s\p{P}]|$)/gu, (_match: string, prefix: string, content: string) => {
		boldTargets.push(content);
		return `${prefix}${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// Italics (* / _)
	// 1. Asterisk italic: *text* (excluding bold or multi-asterisk)
	text = text.replace(/(^|[^*])\*([^\s*](?:[^*\n]*?[^\s*])?)\*(?!\*)/g, "$1_$2_");
	// 2. Underscore italic: _text_ (excluding intra-word snake_case)
	text = text.replace(/(^|[\s\p{P}])_([^\s_](?:[^_\n]*?[^\s_])?)_(?=[\s\p{P}]|$)/gu, "$1_$2_");

	// Restore bold targets to WhatsApp *text* format
	const boldPattern = new RegExp(`${BOLD_MARK}(\\d+)${BOLD_MARK}`, "g");
	text = text.replace(boldPattern, (_match, i) => `*${boldTargets[Number(i)]}*`);

	// Strikethrough (~~text~~ -> ~text~)
	text = text.replace(/~~([^\s~](?:[^~\n]*?[^\s~])?)~~/g, "~$1~");

	// Restore protected URLs
	const urlPattern = new RegExp(`${URL_MARK}(\\d+)${URL_MARK}`, "g");
	text = text.replace(urlPattern, (_match, i) => urls[Number(i)] ?? "");

	text = restoreCodeBlocks(text, codeBlocks);

	return text.trim();
}
