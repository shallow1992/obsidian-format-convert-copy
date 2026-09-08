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

	// 1. Desktop Electron clipboard (supports synchronous rich HTML + plain text write)
	if (!Platform.isMobile) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const electron =
				typeof (window as any)?.require === "function"
					? (window as any).require("electron")
					: typeof require === "function"
					? require("electron")
					: null;

			if (electron && electron.clipboard && typeof electron.clipboard.write === "function") {
				if (html) {
					electron.clipboard.write({ text, html });
				} else {
					electron.clipboard.writeText(text);
				}
				notifySuccess(t("noticeCopied", { format: label }));
				return true;
			}
		} catch (_electronError) {
			// Proceed to DOM copy fallback
		}

		// 2. Synchronous DOM copy event handler (cross-platform HTML + plain text write)
		try {
			let copiedWithHtml = false;
			const copyListener = (event: ClipboardEvent) => {
				event.preventDefault();
				if (event.clipboardData) {
					event.clipboardData.clearData();
					if (html) {
						event.clipboardData.setData("text/html", html);
					}
					event.clipboardData.setData("text/plain", text);
					copiedWithHtml = true;
				}
			};

			document.addEventListener("copy", copyListener, { once: true });
			const execSuccess = document.execCommand("copy");
			document.removeEventListener("copy", copyListener);

			if (execSuccess && copiedWithHtml) {
				notifySuccess(t("noticeCopied", { format: label }));
				return true;
			}
		} catch (_domError) {
			// Proceed to navigator.clipboard
		}

		// 3. Modern asynchronous ClipboardItem write
		if (html) {
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
	}

	// 4. Plain text write (Mobile primary flow and desktop final fallback)
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

	// 5. Final textarea fallback
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
