import { Platform } from "obsidian";
import { convertToDiscord } from "./discord";
import { convertToSlack } from "./slack";
import { convertToSlackMobileHtml } from "./slackMobile";
import { convertToSlackTexty } from "./slackTexty";
import { convertToWhatsApp } from "./whatsapp";
import { FormatType } from "../types";

export interface ConvertedResult {
	text: string;
	html?: string;
	label: string;
	customMimeTypes?: Record<string, string>;
}

/**
 * Dispatcher to execute markdown conversions based on format type.
 * When running on mobile (iOS/Android) or when isMobile is explicitly true,
 * Slack format produces rich text/html to match mobile Slack's clipboard requirements.
 * On desktop, it produces slack/texty Quill Delta for 100% native block restoration.
 */
export function convertMarkdown(
	content: string,
	type: FormatType,
	isMobile: boolean = Platform.isMobile
): ConvertedResult {
	switch (type) {
		case "slack": {
			if (isMobile) {
				const html = convertToSlackMobileHtml(content);
				const plain = convertToSlack(content, { preserveMobileEmptyLines: true });
				return {
					text: plain,
					html,
					label: "Slack",
				};
			}
			const res = convertToSlackTexty(content);
			return {
				text: res.plain,
				label: "Slack",
				customMimeTypes: {
					"slack/texty": res.texty,
					"text/markdown": res.markdown,
				},
			};
		}
		case "discord":
			return {
				text: convertToDiscord(content),
				label: "Discord",
			};
		case "whatsapp":
			return {
				text: convertToWhatsApp(content),
				label: "WhatsApp",
			};
		case "raw":
			return {
				text: content,
				label: "Markdown",
			};
	}
}

export { convertToDiscord } from "./discord";
export { convertToSlack, convertToSlackHtml } from "./slack";
export { convertToSlackMobileHtml } from "./slackMobile";
export { convertToSlackTexty } from "./slackTexty";
export { convertToWhatsApp } from "./whatsapp";
