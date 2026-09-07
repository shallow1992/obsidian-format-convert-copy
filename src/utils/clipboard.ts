import { Notice, Platform } from "obsidian";

/**
 * テキスト（および利用可能な環境ではHTML）をOSクリップボードにコピーする。
 * モバイル（iOS / Android）環境とデスクトップ環境で最適なフォールバック処理を行う。
 */
export async function copyToClipboard(text: string, label: string, html?: string): Promise<boolean> {
	// モバイル(特にiOSのWebView)はクリップボード書き込みに厳格なユーザー操作の有効期限があり、
	// 失敗するとその後のフォールバックも巻き添えになるため、モバイルではプレーンテキストで確実に書き込む
	if (html && !Platform.isMobile) {
		try {
			// Electron環境(デスクトップ)
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const electron = require("electron");
			if (electron && electron.clipboard) {
				electron.clipboard.write({ text, html });
				new Notice(`${label}形式でコピーしました`);
				return true;
			}
		} catch (_electronError) {
			// Electronが使えない環境（Web版など）は次へ
		}

		try {
			if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
				const item = new ClipboardItem({
					"text/plain": new Blob([text], { type: "text/plain" }),
					"text/html": new Blob([html], { type: "text/html" }),
				});
				await navigator.clipboard.write([item]);
				new Notice(`${label}形式でコピーしました`);
				return true;
			}
		} catch (clipboardItemError) {
			console.warn("format-convert: ClipboardItem write failed, fallback to plain text", clipboardItemError);
		}
	}

	// プレーンテキスト書き込み（デスクトップのフォールバックおよびモバイルのメイン処理）
	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(text);
			new Notice(html && !Platform.isMobile ? `${label}形式でコピーしました（簡易版）` : `${label}形式でコピーしました`);
			return true;
		}
	} catch (error) {
		console.warn("format-convert: writeText failed, attempting execCommand fallback", error);
	}

	// 最終フォールバック（iOS WebViewなどで古いexecCommandが効く場合）
	try {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.style.position = "fixed";
		textArea.style.left = "-9999px";
		textArea.style.top = "-9999px";
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		const successful = document.execCommand("copy");
		document.body.removeChild(textArea);
		if (successful) {
			new Notice(`${label}形式でコピーしました`);
			return true;
		}
	} catch (execError) {
		console.error("format-convert: execCommand fallback failed", execError);
	}

	new Notice("クリップボードへのコピーに失敗しました");
	return false;
}
