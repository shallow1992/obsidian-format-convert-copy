export type FormatType = "slack" | "discord" | "whatsapp" | "raw";

export interface FormatConvertSettings {
	// ナビゲーションバー / リボンアイコン（直接コピー & 選択メニュー）
	showRibbonSlackIcon: boolean;
	showRibbonDiscordIcon: boolean;
	showRibbonWhatsAppIcon: boolean;
	showRibbonRawIcon: boolean;
	showRibbonMenuIcon: boolean;

	// ファイルエクスプローラメニュー（長押し / 右クリック）
	showFileSlackItem: boolean;
	showFileDiscordItem: boolean;
	showFileWhatsAppItem: boolean;
	showFileRawItem: boolean;
	showFileMenuItem: boolean;

	// エディタコンテキストメニュー（デスクトップの右クリック）
	showSlackInMenu: boolean;
	showDiscordInMenu: boolean;
	showWhatsAppInMenu: boolean;
	showRawInMenu: boolean;

	// コピー動作設定
	emptySelectionBehavior: EmptySelectionBehavior;
	silentMode: boolean;
}

export type EmptySelectionBehavior = "document" | "currentLine";

export const DEFAULT_SETTINGS: FormatConvertSettings = {
	// ナビゲーションバー / リボン初期値
	showRibbonSlackIcon: true,
	showRibbonDiscordIcon: false,
	showRibbonWhatsAppIcon: false,
	showRibbonRawIcon: false,
	showRibbonMenuIcon: false,

	// ファイルエクスプローラ初期値
	showFileSlackItem: true,
	showFileDiscordItem: false,
	showFileWhatsAppItem: false,
	showFileRawItem: false,
	showFileMenuItem: true,

	// デスクトップエディタメニュー初期値
	showSlackInMenu: true,
	showDiscordInMenu: true,
	showWhatsAppInMenu: true,
	showRawInMenu: true,

	// コピー動作設定初期値
	emptySelectionBehavior: "document",
	silentMode: false,
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
