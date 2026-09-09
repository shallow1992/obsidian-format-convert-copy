import {
	BOLD_MARK,
	CODE_MARK,
	extractCodeBlocks,
	isSafeUrl,
	resolveWikilinks,
	restoreCodeBlocks,
} from "./common";

export interface SlackConvertOptions {
	preserveMobileEmptyLines?: boolean;
}

/**
 * Converts Markdown to Slack mrkdwn plain text.
 */
export function convertToSlack(md: string, options?: SlackConvertOptions): string {
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
		(code) => "`" + code + "`",
		(math) => `$$\n${math}\n$$`,
		(math) => `$${math}$`
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
	text = text.replace(/^>[ \t]*\[!([A-Za-z]+)\][ \t]*(.*)$/gm, (_match, type, title) => {
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
	text = text.replace(/\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g, (_match, title, url) => {
		const cleanUrl = url.trim();
		if (isSafeUrl(cleanUrl)) {
			return `<${cleanUrl}|${title}>`;
		}
		return title;
	});
	text = text.replace(/^[-*+]\s+/gm, "• ");

	text = restoreCodeBlocks(text, codeBlocks);
	text = text.trim();

	if (options?.preserveMobileEmptyLines) {
		text = text.replace(/\n\n+/g, (match) => "\n" + "\u00A0\n".repeat(match.length - 1));
	}

	return text;
}

export { convertToSlackMobileHtml as convertToSlackHtml } from "./slackMobile";

