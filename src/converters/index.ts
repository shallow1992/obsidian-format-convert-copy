import { convertToDiscord } from "./discord";
import { convertToSlack, convertToSlackHtml } from "./slack";
import { convertToWhatsApp } from "./whatsapp";
import { FormatType } from "../types";

export interface ConvertedResult {
	text: string;
	html?: string;
	label: string;
}

/**
 * フォーマットタイプに応じた変換を実行するディスパッチャ
 */
export function convertMarkdown(content: string, type: FormatType): ConvertedResult {
	switch (type) {
		case "slack":
			return {
				text: convertToSlack(content),
				html: convertToSlackHtml(content),
				label: "Slack",
			};
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
export { convertToWhatsApp } from "./whatsapp";
