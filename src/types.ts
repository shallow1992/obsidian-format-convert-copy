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
	showEditorMenuItem: boolean;

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
	showEditorMenuItem: true,

	// Copy behavior default values
	emptySelectionBehavior: "document",
	showNotification: true,
};

import { t, type TranslationKey } from "./i18n";

export interface FormatDefinition {
	id: FormatType;
	commandId: string;
	icon: string;
	actionKey: TranslationKey;
	cmdKey: TranslationKey;
	settings: {
		ribbon: keyof FormatConvertSettings;
		file: keyof FormatConvertSettings;
		editor: keyof FormatConvertSettings;
	};
}

export const FORMAT_DEFINITIONS: FormatDefinition[] = [
	{
		id: "slack",
		commandId: "convert-slack",
		icon: "share-2",
		actionKey: "actionCopySlack",
		cmdKey: "cmdSlack",
		settings: {
			ribbon: "showRibbonSlackIcon",
			file: "showFileSlackItem",
			editor: "showSlackInMenu",
		},
	},
	{
		id: "discord",
		commandId: "convert-discord",
		icon: "message-square",
		actionKey: "actionCopyDiscord",
		cmdKey: "cmdDiscord",
		settings: {
			ribbon: "showRibbonDiscordIcon",
			file: "showFileDiscordItem",
			editor: "showDiscordInMenu",
		},
	},
	{
		id: "whatsapp",
		commandId: "convert-whatsapp",
		icon: "message-circle",
		actionKey: "actionCopyWhatsApp",
		cmdKey: "cmdWhatsApp",
		settings: {
			ribbon: "showRibbonWhatsAppIcon",
			file: "showFileWhatsAppItem",
			editor: "showWhatsAppInMenu",
		},
	},
	{
		id: "raw",
		commandId: "copy-raw-markdown",
		icon: "file-text",
		actionKey: "actionCopyRaw",
		cmdKey: "cmdRaw",
		settings: {
			ribbon: "showRibbonRawIcon",
			file: "showFileRawItem",
			editor: "showRawInMenu",
		},
	},
];

export interface FormatItemConfig {
	id: FormatType;
	label: string;
	icon: string;
}

export function getFormatItems(): FormatItemConfig[] {
	return FORMAT_DEFINITIONS.map((def) => ({
		id: def.id,
		label: t(def.actionKey),
		icon: def.icon,
	}));
}
