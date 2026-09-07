import { extractCodeBlocks, resolveWikilinks, restoreCodeBlocks } from "./common";

/**
 * MarkdownをDiscord形式に変換する
 */
export function convertToDiscord(md: string): string {
	let text = resolveWikilinks(md);

	// コードブロック・テーブルの抽出・保護
	const extraction = extractCodeBlocks(
		text,
		(code) => "```\n" + code + "\n```",
		(code) => "`" + code + "`"
	);
	text = extraction.text;
	const codeBlocks = extraction.blocks;

	// Discordでは __text__ は下線なので、標準Markdownの太字 __text__ は **text** に統一する
	text = text.replace(/__(.+?)__/g, "**$1**");

	// <u>...</u> はDiscordの下線記法（__text__）に変換する
	text = text.replace(/<u>([\s\S]*?)<\/u>/gi, "__$1__");

	// Callout (e.g. > [!NOTE] 内容)
	text = text.replace(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/gm, (_match, type, title) => {
		const label = title.trim() || type.toUpperCase();
		return `> **[${label}]**`;
	});

	// チェックボックス (タスクリスト) の変換
	// Discordでは打消し線を併用して完了を明示
	text = text.replace(/^(\s*)[-*+]\s+\[ \]\s+(.*)$/gm, "$1☐ $2");
	text = text.replace(/^(\s*)[-*+]\s+\[[xX]\]\s+(.*)$/gm, "$1☑ ~~$2~~");

	text = restoreCodeBlocks(text, codeBlocks);

	return text.trim();
}

