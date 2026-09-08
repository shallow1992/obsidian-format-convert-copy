import { Notice, Platform } from "obsidian";
import { t } from "../i18n";

/**
 * Copies text (and HTML / custom MIME types where supported) to the OS clipboard.
 * Performs optimal fallback handling across mobile (iOS / Android) and desktop environments.
 */
export async function copyToClipboard(
	text: string,
	label: string,
	html?: string,
	silent: boolean = false,
	customMimeTypes?: Record<string, string>
): Promise<boolean> {
	const notifySuccess = (message: string) => {
		if (!silent) {
			new Notice(message);
		}
	};

	// 1. If custom MIME types (e.g., slack/texty) are present, use synchronous DOM copy event first.
	// This avoids ClipboardItem type whitelist rejection in modern browsers and writes all types atomically.
	if (customMimeTypes && Object.keys(customMimeTypes).length > 0) {
		try {
			let copiedCustom = false;
			const copyListener = (event: ClipboardEvent) => {
				event.preventDefault();
				if (event.clipboardData) {
					event.clipboardData.clearData();
					event.clipboardData.setData("text/plain", text);
					if (html) {
						event.clipboardData.setData("text/html", html);
					}
					for (const [mime, content] of Object.entries(customMimeTypes)) {
						if (content !== undefined && content !== null) {
							event.clipboardData.setData(mime, content);
						}
					}
					copiedCustom = true;
				}
			};

			document.addEventListener("copy", copyListener, { once: true });
			const execSuccess = document.execCommand("copy");
			document.removeEventListener("copy", copyListener);

			if (execSuccess && copiedCustom) {
				notifySuccess(t("noticeCopied", { format: label }));
				return true;
			}
		} catch (domCustomError) {
			console.warn("format-convert-copy: Custom MIME DOM copy failed, trying fallbacks", domCustomError);
		}
	}

	// 2. Rich text write (HTML + Plain Text) for Slack and other rich-text editors
	if (html) {
		// Method A: Desktop Electron clipboard (synchronous rich write)
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
					electron.clipboard.write({ text, html });
					notifySuccess(t("noticeCopied", { format: label }));
					return true;
				}
			} catch (_electronError) {
				// Proceed to Web Clipboard API / DOM methods
			}
		}

		// Method B: Modern Async Clipboard API with ClipboardItem (iOS 13.4+, Android, Chrome/Safari)
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
			console.warn("format-convert-copy: ClipboardItem write failed, trying DOM copy event", clipboardItemError);
		}

		// Method C: Synchronous DOM copy event handler (cross-platform HTML + plain text fallback)
		try {
			let copiedWithHtml = false;
			const copyListener = (event: ClipboardEvent) => {
				event.preventDefault();
				if (event.clipboardData) {
					event.clipboardData.clearData();
					event.clipboardData.setData("text/plain", text);
					event.clipboardData.setData("text/html", html);
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
			// Proceed to plain text fallback
		}
	}

	// 3. Plain text fallback (for plain text formats like raw Markdown or when rich text write fails)
	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(text);
			notifySuccess(
				html
					? t("noticeCopiedSimple", { format: label })
					: t("noticeCopied", { format: label })
			);
			return true;
		}
	} catch (error) {
		console.warn("format-convert-copy: writeText failed, attempting execCommand fallback", error);
	}

	// 4. Final legacy textarea fallback
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
			notifySuccess(
				html
					? t("noticeCopiedSimple", { format: label })
					: t("noticeCopied", { format: label })
			);
			return true;
		}
	} catch (execError) {
		console.error("format-convert-copy: execCommand fallback failed", execError);
	}

	new Notice(t("noticeFailed"));
	return false;
}
