export type FormatType = "slack" | "discord" | "whatsapp" | "raw";

export interface FormatConvertSettings {
	// Navigation bar / ribbon icons (direct copy & format menu)
	showRibbonSlackIcon: boolean;
	showRibbonDiscordIcon: boolean;
	showRibbonWhatsAppIcon: boolean;
	showRibbonRawIcon: boolean;
	showRibbonMenuIcon: boolean;

	// File explorer menu (long-press / right-click)
	showFileSlackItem: boolean;
	showFileDiscordItem: boolean;
	showFileWhatsAppItem: boolean;
	showFileRawItem: boolean;
	showFileMenuItem: boolean;

	// Editor context menu (desktop right-click)
	showSlackInMenu: boolean;
	showDiscordInMenu: boolean;
	showWhatsAppInMenu: boolean;
	showRawInMenu: boolean;

	// Copy behavior and notifications
	emptySelectionBehavior: EmptySelectionBehavior;
	showNotification: boolean;
}

export type EmptySelectionBehavior = "document" | "currentLine";

export const DEFAULT_SETTINGS: FormatConvertSettings = {
	// Navigation bar / ribbon default values
	showRibbonSlackIcon: false,
	showRibbonDiscordIcon: false,
	showRibbonWhatsAppIcon: false,
	showRibbonRawIcon: false,
	showRibbonMenuIcon: true,

	// File explorer default values
	showFileSlackItem: false,
	showFileDiscordItem: false,
	showFileWhatsAppItem: false,
	showFileRawItem: false,
	showFileMenuItem: true,

	// Desktop editor context menu default values
	showSlackInMenu: false,
	showDiscordInMenu: false,
	showWhatsAppInMenu: false,
	showRawInMenu: false,

	// Copy behavior default values
	emptySelectionBehavior: "document",
	showNotification: true,
};

import { t } from "./i18n";

export interface FormatItemConfig {
	id: FormatType;
	label: string;
	icon: string;
}

export function getFormatItems(): FormatItemConfig[] {
	return [
		{ id: "slack", label: t("actionCopySlack"), icon: "share-2" },
		{ id: "discord", label: t("actionCopyDiscord"), icon: "message-square" },
		{ id: "whatsapp", label: t("actionCopyWhatsApp"), icon: "message-circle" },
		{ id: "raw", label: t("actionCopyRaw"), icon: "file-text" },
	];
}

export const FORMAT_ITEMS: FormatItemConfig[] = [
	{ id: "slack", label: "Copy for Slack", icon: "share-2" },
	{ id: "discord", label: "Copy for Discord", icon: "message-square" },
	{ id: "whatsapp", label: "Copy for WhatsApp", icon: "message-circle" },
	{ id: "raw", label: "Copy as raw Markdown", icon: "file-text" },
];
