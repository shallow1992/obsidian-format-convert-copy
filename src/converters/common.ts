export const CODE_MARK = "\uE000";
export const BOLD_MARK = "\uE001";
export const UNDERLINE_MARK = "\uE002";

export interface CodeExtraction {
	text: string;
	blocks: string[];
}

/**
 * Wikilink ([[リンク名|エイリアス]] や [[リンク名]]) をプレーンテキスト表現に解決する
 */
export function resolveWikilinks(md: string): string {
	return md.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_match, name, alias) => alias || name);
}

/**
 * HTML特殊文字をエスケープする
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * URLスキームの安全性を検証する。
 * http, https, mailto, tel, obsidian などの安全なスキーム、またはページ内アンカー(#)のみ許可する。
 * javascript: や data: などの危険なスキームを遮断する。
 */
export function isSafeUrl(rawUrl: string): boolean {
	const trimmed = rawUrl.trim();
	if (trimmed.startsWith("#")) {
		return true;
	}
	// コントロール文字（ASCII 0-31, 127）を拒否
	if (/[\x00-\x1F\x7F]/.test(trimmed)) {
		return false;
	}
	return /^(https?|mailto|tel|obsidian):/i.test(trimmed);
}

/**
 * コードフェンスおよびインラインコードを行単位・構文単位で安全に抽出し、
 * プレースホルダーに退避する
 */
export function extractCodeBlocks(
	source: string,
	wrapBlock: (code: string, lang?: string) => string,
	wrapInline: (code: string) => string
): CodeExtraction {
	const lines = source.split("\n");
	const blocks: string[] = [];
	const outputLines: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		const fenceOpen = line.match(/^```([^`]*)$/);

		if (fenceOpen) {
			const lang = fenceOpen[1].trim();
			const codeLines: string[] = [];
			let j = i + 1;
			while (j < lines.length && lines[j].trim() !== "```") {
				codeLines.push(lines[j]);
				j++;
			}
			blocks.push(wrapBlock(codeLines.join("\n"), lang));
			outputLines.push(`${CODE_MARK}${blocks.length - 1}${CODE_MARK}`);
			i = j + 1;
			continue;
		}

		if (line.includes("```")) {
			const replaced = line.replace(/```([^`]*?)```/g, (_match, code) => {
				blocks.push(wrapInline(code));
				return `${CODE_MARK}${blocks.length - 1}${CODE_MARK}`;
			});
			outputLines.push(replaced);
			i++;
			continue;
		}

		outputLines.push(line);
		i++;
	}

	return { text: outputLines.join("\n"), blocks };
}

/**
 * プレースホルダーを実際のコードブロックに戻す
 */
export function restoreCodeBlocks(text: string, blocks: string[]): string {
	const pattern = new RegExp(`${CODE_MARK}(\\d+)${CODE_MARK}`, "g");
	return text.replace(pattern, (_match, i) => blocks[Number(i)] ?? "");
}
