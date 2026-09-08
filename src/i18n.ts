import { moment } from "obsidian";

const en = {
	// Commands
	cmdSlack: "Convert and copy for Slack",
	cmdDiscord: "Convert and copy for Discord",
	cmdWhatsApp: "Convert and copy for WhatsApp",
	cmdRaw: "Copy as raw Markdown",
	cmdMenu: "Choose format and copy (Show menu)",

	// Format Labels
	formatSlack: "Slack",
	formatDiscord: "Discord",
	formatWhatsApp: "WhatsApp",
	formatRaw: "Markdown",

	// Format Item Actions (used in menus and lists)
	actionCopySlack: "Copy for Slack",
	actionCopyDiscord: "Copy for Discord",
	actionCopyWhatsApp: "Copy for WhatsApp",
	actionCopyRaw: "Copy as raw Markdown",
	actionChooseMenu: "Convert and copy...",

	// Notices
	noticeCopied: "Copied for {format}",
	noticeCopiedSimple: "Copied for {format} (plain text)",
	noticeFailed: "Failed to copy to clipboard",
	noticeNoActiveNote: "No active note to copy",
	noticeReadFailed: "Failed to read note content",

	// Ribbon / Navigation Bar Settings
	settingsRibbonHeadingDesktop: "Left Ribbon (Desktop)",
	settingsRibbonHeadingMobile: "Navigation Bar (Mobile)",
	settingsRibbonDesc: "Configure direct copy icons or a format selection menu icon for one-tap copying.",
	settingsRibbonSlackName: "Slack format",
	settingsRibbonSlackDesc: "Adds a direct copy icon for Slack to the {area}.",
	settingsRibbonDiscordName: "Discord format",
	settingsRibbonDiscordDesc: "Adds a direct copy icon for Discord to the {area}.",
	settingsRibbonWhatsAppName: "WhatsApp format",
	settingsRibbonWhatsAppDesc: "Adds a direct copy icon for WhatsApp to the {area}.",
	settingsRibbonRawName: "Markdown format",
	settingsRibbonRawDesc: "Adds a direct copy icon for raw Markdown to the {area}.",
	settingsRibbonMenuName: "Format selection menu",
	settingsRibbonMenuDesc: "Adds a menu icon to choose between all formats to the {area}.",

	// File Explorer Menu Settings
	settingsFileHeading: "File Explorer Menu",
	settingsFileDesc: "Configure items displayed when right-clicking or long-pressing notes in the file list.",
	settingsFileSlackName: "Slack format",
	settingsFileSlackDesc: "Directly adds a Slack copy item to the file menu.",
	settingsFileDiscordName: "Discord format",
	settingsFileDiscordDesc: "Directly adds a Discord copy item to the file menu.",
	settingsFileWhatsAppName: "WhatsApp format",
	settingsFileWhatsAppDesc: "Directly adds a WhatsApp copy item to the file menu.",
	settingsFileRawName: "Markdown format",
	settingsFileRawDesc: "Directly adds a raw Markdown copy item to the file menu.",
	settingsFileMenuName: "Format selection menu",
	settingsFileMenuDesc: "Shows a submenu with all conversion formats.",

	// Editor Context Menu Settings
	settingsEditorHeading: "Editor Context Menu (Desktop)",
	settingsEditorDesc: "Configure items displayed when right-clicking inside the editor on desktop.",
	settingsEditorSlackName: "Slack format",
	settingsEditorDiscordName: "Discord format",
	settingsEditorWhatsAppName: "WhatsApp format",
	settingsEditorRawName: "Markdown format",

	// Behavior & Notifications Settings
	settingsBehaviorHeading: "Copy Behavior & Notifications",
	settingsEmptySelectionName: "Empty selection behavior",
	settingsEmptySelectionDesc: "Choose what to copy when no text is selected in the editor.",
	settingsEmptySelectionDoc: "Entire note (default)",
	settingsEmptySelectionLine: "Current line (cursor line)",
	settingsSilentModeName: "Silent mode",
	settingsSilentModeDesc: "Suppress success toast notifications for uninterrupted copying. Error notifications will still be displayed.",
};

const ja: typeof en = {
	// Commands
	cmdSlack: "Slack形式に変換してコピー",
	cmdDiscord: "Discord形式に変換してコピー",
	cmdWhatsApp: "WhatsApp形式に変換してコピー",
	cmdRaw: "Markdownのままコピー",
	cmdMenu: "形式を選択してコピー（メニュー表示）",

	// Format Labels
	formatSlack: "Slack",
	formatDiscord: "Discord",
	formatWhatsApp: "WhatsApp",
	formatRaw: "Markdown",

	// Format Item Actions
	actionCopySlack: "Slack形式でコピー",
	actionCopyDiscord: "Discord形式でコピー",
	actionCopyWhatsApp: "WhatsApp形式でコピー",
	actionCopyRaw: "Markdownのままコピー",
	actionChooseMenu: "フォーマット変換してコピー",

	// Notices
	noticeCopied: "{format}形式でコピーしました",
	noticeCopiedSimple: "{format}形式でコピーしました（簡易版）",
	noticeFailed: "クリップボードへのコピーに失敗しました",
	noticeNoActiveNote: "対象のノートが開かれていません",
	noticeReadFailed: "ノートの読み込みに失敗しました",

	// Ribbon / Navigation Bar Settings
	settingsRibbonHeadingDesktop: "画面左リボン（デスクトップ）",
	settingsRibbonHeadingMobile: "ナビゲーションバー（モバイル）",
	settingsRibbonDesc: "ワンタップで即座にコピーする直接アイコンや、全形式から選べるメニューアイコンを自由に配置できます。",
	settingsRibbonSlackName: "Slack形式",
	settingsRibbonSlackDesc: "{area}にSlack直接コピーのアイコンを追加します。",
	settingsRibbonDiscordName: "Discord形式",
	settingsRibbonDiscordDesc: "{area}にDiscord直接コピーのアイコンを追加します。",
	settingsRibbonWhatsAppName: "WhatsApp形式",
	settingsRibbonWhatsAppDesc: "{area}にWhatsApp直接コピーのアイコンを追加します。",
	settingsRibbonRawName: "Markdown形式",
	settingsRibbonRawDesc: "{area}にMarkdown直接コピーのアイコンを追加します。",
	settingsRibbonMenuName: "形式選択メニュー",
	settingsRibbonMenuDesc: "{area}に全形式を選べるメニューアイコンを追加します。",

	// File Explorer Menu Settings
	settingsFileHeading: "ファイルエクスプローラメニュー",
	settingsFileDesc: "ファイル一覧でノートを長押し（モバイル）または右クリック（PC）した際に表示する項目を設定します。",
	settingsFileSlackName: "Slack形式",
	settingsFileSlackDesc: "ファイルメニューにSlack直接コピー項目を追加します。",
	settingsFileDiscordName: "Discord形式",
	settingsFileDiscordDesc: "ファイルメニューにDiscord直接コピー項目を追加します。",
	settingsFileWhatsAppName: "WhatsApp形式",
	settingsFileWhatsAppDesc: "ファイルメニューにWhatsApp直接コピー項目を追加します。",
	settingsFileRawName: "Markdown形式",
	settingsFileRawDesc: "ファイルメニューにMarkdown直接コピー項目を追加します。",
	settingsFileMenuName: "形式選択メニュー",
	settingsFileMenuDesc: "全形式から選べるサブメニュー（フォーマット変換してコピー）を表示します。",

	// Editor Context Menu Settings
	settingsEditorHeading: "エディタ右クリックメニュー（デスクトップPC）",
	settingsEditorDesc: "エディタ内で右クリックした際のコンテキストメニューに表示する項目を設定します。",
	settingsEditorSlackName: "Slack形式",
	settingsEditorDiscordName: "Discord形式",
	settingsEditorWhatsAppName: "WhatsApp形式",
	settingsEditorRawName: "Markdown形式",

	// Behavior & Notifications Settings
	settingsBehaviorHeading: "コピー動作・通知設定",
	settingsEmptySelectionName: "未選択時のコピー対象",
	settingsEmptySelectionDesc: "エディタで文字を選択していない状態でコピーを実行した際の対象を指定します。",
	settingsEmptySelectionDoc: "ノート全体（全文）",
	settingsEmptySelectionLine: "カーソル行（現在の1行）",
	settingsSilentModeName: "サイレントモード",
	settingsSilentModeDesc: "コピー成功時の画面上部トースト通知を非表示にします（エラー時の通知は維持されます）。",
};

export type TranslationKey = keyof typeof en;

let overrideLocale: string | null = null;

export function setLocaleForTesting(locale: string | null): void {
	overrideLocale = locale;
}

export function getCurrentLocale(): string {
	if (overrideLocale !== null) {
		return overrideLocale;
	}
	try {
		if (typeof moment !== "undefined" && typeof moment.locale === "function") {
			return moment.locale();
		}
	} catch (_e) {
		// fallback
	}
	return "en";
}

export function t(key: TranslationKey, params?: Record<string, string>): string {
	const locale = getCurrentLocale();
	const dict = locale.startsWith("ja") ? ja : en;
	let text = dict[key] || en[key] || key;

	if (params) {
		for (const [paramKey, paramVal] of Object.entries(params)) {
			text = text.split(`{${paramKey}}`).join(paramVal);
		}
	}

	return text;
}
