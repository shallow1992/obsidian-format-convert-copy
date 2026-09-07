export interface FormatConvertSettings {
	showSlackInMenu: boolean;
	showDiscordInMenu: boolean;
	showRawInMenu: boolean;
	showRibbonIcon: boolean;
}

export const DEFAULT_SETTINGS: FormatConvertSettings = {
	showSlackInMenu: true,
	showDiscordInMenu: true,
	showRawInMenu: true,
	showRibbonIcon: true,
};
