import { convertToDiscord } from "./discord";
import { convertToSlack, convertToSlackHtml } from "./slack";
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
 */
export function convertMarkdown(content: string, type: FormatType): ConvertedResult {
	switch (type) {
		case "slack": {
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
export { convertToSlackTexty } from "./slackTexty";
export { convertToWhatsApp } from "./whatsapp";
