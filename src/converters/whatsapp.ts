import {
	BOLD_MARK,
	CODE_MARK,
	extractCodeBlocks,
	resolveWikilinks,
	restoreCodeBlocks,
} from "./common";

/**
 * MarkdownをWhatsApp形式に変換する。
 * WhatsApp書式ルール:
 * - 太字: *text*
 * - 斜体: _text_
 * - 打消し線: ~text~
 * - 等幅/コード: ```code``` または `inline`
 * - 引用: > 引用
 * - 箇条書き: - または * または •
 * - リンク: WhatsAppはマークダウンリンク[title](url)を解釈しないため、title (url) または url に展開する
 */
export function convertToWhatsApp(md: string): string {
	let text = resolveWikilinks(md);

	// <u>...</u> はWhatsAppに対応記法がないためタグを除去
	text = text.replace(/<u>([\s\S]*?)<\/u>/gi, "$1");

	// チェックボックス (タスクリスト) の変換
	text = text.replace(/^(\s*)[-*+]\s+\[ \]\s+/gm, "$1☐ ");
	text = text.replace(/^(\s*)[-*+]\s+\[[xX]\]\s+/gm, "$1☑ ");

	// コードブロックの抽出
	const extraction = extractCodeBlocks(
		text,
		(code) => "```\n" + code + "\n```",
		(code) => "`" + code + "`"
	);
	text = extraction.text;
	const codeBlocks = extraction.blocks;

	// 残りのインラインコードを退避
	text = text.replace(/`([^`]+)`/g, (match) => {
		codeBlocks.push(match);
		return `${CODE_MARK}${codeBlocks.length - 1}${CODE_MARK}`;
	});

	// 見出し・太字（**/__）・Calloutタイトルを退避
	const boldTargets: string[] = [];

	// Callout (e.g. > [!NOTE] 内容) を退避
	text = text.replace(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/gm, (_match, type, title) => {
		const label = title.trim() || type.toUpperCase();
		boldTargets.push(`[${label}]`);
		return `> ${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// 見出しを太字へ
	text = text.replace(/^#{1,6}\s+(.*)$/gm, (_match, content) => {
		boldTargets.push(content);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// 太字 (**)
	text = text.replace(/(\*\*|__)(.+?)\1/g, (_match, _marker, content) => {
		boldTargets.push(content);
		return `${BOLD_MARK}${boldTargets.length - 1}${BOLD_MARK}`;
	});

	// 斜体 (* / _)
	text = text.replace(/(\*|_)(.+?)\1/g, "_$2_");

	// 太字をWhatsAppの *text* に戻す
	const boldPattern = new RegExp(`${BOLD_MARK}(\\d+)${BOLD_MARK}`, "g");
	text = text.replace(boldPattern, (_match, i) => `*${boldTargets[Number(i)]}*`);

	// 打消し線 (~~)
	text = text.replace(/~~(.+?)~~/g, "~$1~");

	// リンク [title](url) -> title (url) または url
	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, title, url) => {
		if (title.trim() === url.trim()) return url;
		return `${title} (${url})`;
	});

	text = restoreCodeBlocks(text, codeBlocks);

	return text.trim();
}
