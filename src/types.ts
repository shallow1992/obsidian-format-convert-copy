export interface FormatConvertSettings {
	// エディタコンテキストメニュー（デスクトップの右クリック）
	showSlackInMenu: boolean;
	showDiscordInMenu: boolean;
	showWhatsAppInMenu: boolean;
	showRawInMenu: boolean;

	// ナビゲーションバー / リボンアイコン（直接コピー & 選択メニュー）
	showRibbonMenuIcon: boolean;
	showRibbonSlackIcon: boolean;
	showRibbonDiscordIcon: boolean;
	showRibbonWhatsAppIcon: boolean;
	showRibbonRawIcon: boolean;
}

export const DEFAULT_SETTINGS: FormatConvertSettings = {
	showSlackInMenu: true,
	showDiscordInMenu: true,
	showWhatsAppInMenu: true,
	showRawInMenu: true,

	showRibbonMenuIcon: false,
	showRibbonSlackIcon: true,
	showRibbonDiscordIcon: false,
	showRibbonWhatsAppIcon: false,
	showRibbonRawIcon: false,
};
