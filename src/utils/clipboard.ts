import { Notice, Platform } from "obsidian";
import { t } from "../i18n";

/**
 * Copies text (and HTML where supported) to the OS clipboard.
 * Performs optimal fallback handling across mobile (iOS / Android) and desktop environments.
 */
export async function copyToClipboard(
	text: string,
	label: string,
	html?: string,
	silent: boolean = false
): Promise<boolean> {
	const notifySuccess = (message: string) => {
		if (!silent) {
			new Notice(message);
		}
	};

	// Mobile WebViews (especially iOS) enforce strict user-gesture expiration for clipboard writes.
	// If writing rich HTML fails, any subsequent fallback might also be rejected.
	// Therefore, on mobile we write plain text directly and reliably.
	if (html && !Platform.isMobile) {
		try {
			// Electron environment (desktop)
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const electron = require("electron");
			if (electron && electron.clipboard) {
				electron.clipboard.write({ text, html });
				notifySuccess(t("noticeCopied", { format: label }));
				return true;
			}
		} catch (_electronError) {
			// Proceed if Electron is unavailable (e.g., web context)
		}

		try {
			if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
				const item = new ClipboardItem({
					"text/plain": new Blob([text], { type: "text/plain" }),
					"text/html": new Blob([html], { type: "text/html" }),
				});
				await navigator.clipboard.write([item]);
				notifySuccess(t("noticeCopied", { format: label }));
				return true;
			}
		} catch (clipboardItemError) {
			console.warn("format-convert-copy: ClipboardItem write failed, fallback to plain text", clipboardItemError);
		}
	}

	// Plain text write (desktop fallback and mobile primary flow)
	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(text);
			notifySuccess(
				html && !Platform.isMobile
					? t("noticeCopiedSimple", { format: label })
					: t("noticeCopied", { format: label })
			);
			return true;
		}
	} catch (error) {
		console.warn("format-convert-copy: writeText failed, attempting execCommand fallback", error);
	}

	// Final fallback (for cases where legacy execCommand works in iOS WebView, etc.)
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
			notifySuccess(t("noticeCopied", { format: label }));
			return true;
		}
	} catch (execError) {
		console.error("format-convert-copy: execCommand fallback failed", execError);
	}

	new Notice(t("noticeFailed"));
	return false;
}
