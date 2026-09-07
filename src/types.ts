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
};

export interface FormatItemConfig {
	id: FormatType;
	label: string;
	icon: string;
}

export const FORMAT_ITEMS: FormatItemConfig[] = [
	{ id: "slack", label: "Slack形式でコピー", icon: "share-2" },
	{ id: "discord", label: "Discord形式でコピー", icon: "message-square" },
	{ id: "whatsapp", label: "WhatsApp形式でコピー", icon: "message-circle" },
	{ id: "raw", label: "Markdownのままコピー", icon: "file-text" },
];
