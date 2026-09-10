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

	// 1. Custom MIME types (e.g., slack/texty for Desktop Slack native clipboard)
	// On desktop Electron, writes custom buffers directly via electron.clipboard
	if (customMimeTypes && Object.keys(customMimeTypes).length > 0) {
		if (!Platform.isMobile) {
			try {
				const windowWithRequire = (typeof window !== "undefined" ? window : globalThis) as unknown as {
					require?: (module: string) => {
						clipboard?: {
							write?: (data: { text: string; html?: string }) => void;
							writeBuffer?: (format: string, buffer: Uint8Array) => void;
						};
					};
				};
				const electron = typeof windowWithRequire.require === "function" ? windowWithRequire.require("electron") : null;

				if (electron?.clipboard) {
					if (typeof electron.clipboard.write === "function") {
						electron.clipboard.write({ text, html });
					}
					if (typeof electron.clipboard.writeBuffer === "function") {
						for (const [mime, content] of Object.entries(customMimeTypes)) {
							if (content) {
								const buffer = new TextEncoder().encode(content);
								electron.clipboard.writeBuffer(mime, buffer);
							}
						}
					}
					notifySuccess(t("noticeCopied", { format: label }));
					return true;
				}
			} catch (electronError) {
				console.warn("format-convert-copy: Electron custom MIME write failed, trying standard clipboard", electronError);
			}
		}
	}

	// 2. Rich text write (HTML + Plain Text) for Slack and other rich-text editors
	if (html) {
		// Method A: Desktop Electron clipboard (synchronous rich write)
		if (!Platform.isMobile) {
			try {
				const windowWithRequire = (typeof window !== "undefined" ? window : globalThis) as unknown as {
					require?: (module: string) => { clipboard?: { write?: (data: { text: string; html?: string }) => void } };
				};
				const electron = typeof windowWithRequire.require === "function" ? windowWithRequire.require("electron") : null;

				if (electron?.clipboard && typeof electron.clipboard.write === "function") {
					electron.clipboard.write({ text, html });
					notifySuccess(t("noticeCopied", { format: label }));
					return true;
				}
			} catch {
				// Proceed to Web Clipboard API
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
			console.warn("format-convert-copy: ClipboardItem write failed, falling back to plain text", clipboardItemError);
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
		console.warn("format-convert-copy: writeText failed", error);
	}

	new Notice(t("noticeFailed"));
	return false;
}
