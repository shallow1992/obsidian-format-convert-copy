export interface FormatConvertSettings {
	// エディタコンテキストメニュー（右クリック / 長押し）
	showSlackInMenu: boolean;
	showDiscordInMenu: boolean;
	showRawInMenu: boolean;

	// ナビゲーションバー / リボンアイコン（直接コピー & 選択メニュー）
	showRibbonMenuIcon: boolean;
	showRibbonSlackIcon: boolean;
	showRibbonDiscordIcon: boolean;
	showRibbonRawIcon: boolean;
}

export const DEFAULT_SETTINGS: FormatConvertSettings = {
	showSlackInMenu: true,
	showDiscordInMenu: true,
	showRawInMenu: true,

	showRibbonMenuIcon: false,
	showRibbonSlackIcon: true,
	showRibbonDiscordIcon: false,
	showRibbonRawIcon: false,
};
