import { Editor, MarkdownView, Menu, Notice, Platform, Plugin } from "obsidian";
import { convertToDiscord } from "./converters/discord";
import { convertToSlack, convertToSlackHtml } from "./converters/slack";
import { FormatConvertSettingTab } from "./settings";
import { DEFAULT_SETTINGS, FormatConvertSettings } from "./types";
import { copyToClipboard } from "./utils/clipboard";

function getTargetText(editor?: Editor | null): string {
	if (!editor) return "";
	const selection = editor.getSelection();
	return selection.trim().length > 0 ? selection : editor.getValue();
}

export default class FormatConvertPlugin extends Plugin {
	settings!: FormatConvertSettings;
	ribbonIconEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		// コマンドパレット・ショートカット（PC・モバイル共通）
		this.addCommand({
			id: "convert-slack",
			name: "Slack形式に変換してコピー",
			icon: "clipboard-copy",
			editorCallback: (editor: Editor) => {
				const target = getTargetText(editor);
				copyToClipboard(convertToSlack(target), "Slack", convertToSlackHtml(target));
			},
		});

		this.addCommand({
			id: "convert-discord",
			name: "Discord形式に変換してコピー",
			icon: "clipboard-copy",
			editorCallback: (editor: Editor) => {
				const target = getTargetText(editor);
				copyToClipboard(convertToDiscord(target), "Discord");
			},
		});

		this.addCommand({
			id: "copy-raw-markdown",
			name: "Markdownのままコピー",
			icon: "clipboard-copy",
			editorCallback: (editor: Editor) => {
				const target = getTargetText(editor);
				copyToClipboard(target, "Markdown");
			},
		});

		// エディタコンテキストメニュー（デスクトップの右クリック / モバイルの長押しメニュー）
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
				const target = getTargetText(editor);

				if (this.settings.showSlackInMenu) {
					menu.addItem((item) =>
						item
							.setTitle("Slack形式でコピー")
							.setIcon("clipboard-copy")
							.onClick(() => copyToClipboard(convertToSlack(target), "Slack", convertToSlackHtml(target)))
					);
				}

				if (this.settings.showDiscordInMenu) {
					menu.addItem((item) =>
						item
							.setTitle("Discord形式でコピー")
							.setIcon("clipboard-copy")
							.onClick(() => copyToClipboard(convertToDiscord(target), "Discord"))
					);
				}

				if (this.settings.showRawInMenu) {
					menu.addItem((item) =>
						item
							.setTitle("Markdownのままコピー")
							.setIcon("clipboard-copy")
							.onClick(() => copyToClipboard(target, "Markdown"))
					);
				}
			})
		);

		// リボンアイコンの登録（設定で有効な場合のみ）
		this.refreshRibbonIcon();

		// 設定画面タブの追加
		this.addSettingTab(new FormatConvertSettingTab(this.app, this));
	}

	onunload() {
		// プラグイン無効化・アップデート時にリボンアイコン要素を確実にDOMからクリーンアップ
		this.removeRibbonIcon();
	}

	removeRibbonIcon() {
		if (this.ribbonIconEl) {
			this.ribbonIconEl.remove();
			this.ribbonIconEl = null;
		}
	}

	refreshRibbonIcon() {
		if (this.settings.showRibbonIcon) {
			if (!this.ribbonIconEl) {
				const ribbonTitle = Platform.isMobile ? "形式を選択してコピー" : "Format Convert";
				this.ribbonIconEl = this.addRibbonIcon("share-2", ribbonTitle, (evt: MouseEvent) => {
					const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
					const editor = activeView?.editor;
					const target = getTargetText(editor);
					if (!target) {
						new Notice("アクティブなノートまたは選択テキストがありません");
						return;
					}

					const menu = new Menu();

					if (this.settings.showSlackInMenu) {
						menu.addItem((item) =>
							item
								.setTitle("Slack形式でコピー")
								.setIcon("clipboard-copy")
								.onClick(() => copyToClipboard(convertToSlack(target), "Slack", convertToSlackHtml(target)))
						);
					}

					if (this.settings.showDiscordInMenu) {
						menu.addItem((item) =>
							item
								.setTitle("Discord形式でコピー")
								.setIcon("clipboard-copy")
								.onClick(() => copyToClipboard(convertToDiscord(target), "Discord"))
						);
					}

					if (this.settings.showRawInMenu) {
						menu.addItem((item) =>
							item
								.setTitle("Markdownのままコピー")
								.setIcon("clipboard-copy")
								.onClick(() => copyToClipboard(target, "Markdown"))
						);
					}

					menu.showAtMouseEvent(evt);
				});
			}
		} else {
			this.removeRibbonIcon();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
