import { Editor, MarkdownView, Menu, Notice, Platform, Plugin, TFile } from "obsidian";
import { convertToDiscord } from "./converters/discord";
import { convertToSlack, convertToSlackHtml } from "./converters/slack";
import { convertToWhatsApp } from "./converters/whatsapp";
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
	ribbonIconEls: HTMLElement[] = [];

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
			id: "convert-whatsapp",
			name: "WhatsApp形式に変換してコピー",
			icon: "clipboard-copy",
			editorCallback: (editor: Editor) => {
				const target = getTargetText(editor);
				copyToClipboard(convertToWhatsApp(target), "WhatsApp");
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

		// デスクトップ版（PC）のみエディタ右クリックコンテキストメニューを登録する
		if (!Platform.isMobile) {
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

					if (this.settings.showWhatsAppInMenu) {
						menu.addItem((item) =>
							item
								.setTitle("WhatsApp形式でコピー")
								.setIcon("clipboard-copy")
								.onClick(() => copyToClipboard(convertToWhatsApp(target), "WhatsApp"))
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
		}

		// ファイルエクスプローラ長押し / 右クリックメニュー (PC & iOS/Mobile対応)
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				if (!this.settings.showFileMenu || !(file instanceof TFile) || file.extension !== "md") {
					return;
				}

				const readFileAndCopy = async (converter: (content: string) => { text: string; html?: string }, label: string) => {
					try {
						const content = await this.app.vault.cachedRead(file);
						const result = converter(content);
						await copyToClipboard(result.text, label, result.html);
					} catch (e) {
						new Notice(`${label}形式のコピーに失敗しました`);
					}
				};

				if (this.settings.showSlackInFileMenu) {
					menu.addItem((item) =>
						item
							.setTitle("Slack形式でコピー")
							.setIcon("clipboard-copy")
							.onClick(() =>
								readFileAndCopy(
									(content) => ({
										text: convertToSlack(content),
										html: convertToSlackHtml(content),
									}),
									"Slack"
								)
							)
					);
				}

				if (this.settings.showDiscordInFileMenu) {
					menu.addItem((item) =>
						item
							.setTitle("Discord形式でコピー")
							.setIcon("clipboard-copy")
							.onClick(() => readFileAndCopy((content) => ({ text: convertToDiscord(content) }), "Discord"))
					);
				}

				if (this.settings.showWhatsAppInFileMenu) {
					menu.addItem((item) =>
						item
							.setTitle("WhatsApp形式でコピー")
							.setIcon("clipboard-copy")
							.onClick(() => readFileAndCopy((content) => ({ text: convertToWhatsApp(content) }), "WhatsApp"))
					);
				}

				if (this.settings.showRawInFileMenu) {
					menu.addItem((item) =>
						item
							.setTitle("Markdownのままコピー")
							.setIcon("clipboard-copy")
							.onClick(() => readFileAndCopy((content) => ({ text: content }), "Markdown"))
					);
				}
			})
		);

		// ナビゲーションバー / リボンアイコンの初期化
		this.refreshRibbonIcons();

		// 設定画面タブの追加
		this.addSettingTab(new FormatConvertSettingTab(this.app, this));
	}

	onunload() {
		this.removeAllRibbonIcons();
	}

	removeAllRibbonIcons() {
		for (const el of this.ribbonIconEls) {
			el.remove();
		}
		this.ribbonIconEls = [];
	}

	getActiveTargetText(): string | null {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = activeView?.editor;
		const target = getTargetText(editor);
		if (!target) {
			new Notice("アクティブなノートまたは選択テキストがありません");
			return null;
		}
		return target;
	}

	refreshRibbonIcons() {
		this.removeAllRibbonIcons();

		// 1. Slack直接コピーアイコン
		if (this.settings.showRibbonSlackIcon) {
			const el = this.addRibbonIcon("share-2", "Slack形式でコピー", () => {
				const target = this.getActiveTargetText();
				if (target) {
					copyToClipboard(convertToSlack(target), "Slack", convertToSlackHtml(target));
				}
			});
			this.ribbonIconEls.push(el);
		}

		// 2. Discord直接コピーアイコン
		if (this.settings.showRibbonDiscordIcon) {
			const el = this.addRibbonIcon("message-square", "Discord形式でコピー", () => {
				const target = this.getActiveTargetText();
				if (target) {
					copyToClipboard(convertToDiscord(target), "Discord");
				}
			});
			this.ribbonIconEls.push(el);
		}

		// 3. WhatsApp直接コピーアイコン
		if (this.settings.showRibbonWhatsAppIcon) {
			const el = this.addRibbonIcon("message-circle", "WhatsApp形式でコピー", () => {
				const target = this.getActiveTargetText();
				if (target) {
					copyToClipboard(convertToWhatsApp(target), "WhatsApp");
				}
			});
			this.ribbonIconEls.push(el);
		}

		// 4. Markdown直接コピーアイコン
		if (this.settings.showRibbonRawIcon) {
			const el = this.addRibbonIcon("file-text", "Markdownのままコピー", () => {
				const target = this.getActiveTargetText();
				if (target) {
					copyToClipboard(target, "Markdown");
				}
			});
			this.ribbonIconEls.push(el);
		}

		// 5. 全形式選択メニューアイコン（全形式を一覧表示）
		if (this.settings.showRibbonMenuIcon) {
			const el = this.addRibbonIcon("copy", "形式を選択してコピー", (evt: MouseEvent) => {
				const target = this.getActiveTargetText();
				if (!target) return;

				const menu = new Menu();

				menu.addItem((item) =>
					item
						.setTitle("Slack形式でコピー")
						.setIcon("clipboard-copy")
						.onClick(() => copyToClipboard(convertToSlack(target), "Slack", convertToSlackHtml(target)))
				);

				menu.addItem((item) =>
					item
						.setTitle("Discord形式でコピー")
						.setIcon("clipboard-copy")
						.onClick(() => copyToClipboard(convertToDiscord(target), "Discord"))
				);

				menu.addItem((item) =>
					item
						.setTitle("WhatsApp形式でコピー")
						.setIcon("clipboard-copy")
						.onClick(() => copyToClipboard(convertToWhatsApp(target), "WhatsApp"))
				);

				menu.addItem((item) =>
					item
						.setTitle("Markdownのままコピー")
						.setIcon("clipboard-copy")
						.onClick(() => copyToClipboard(target, "Markdown"))
				);

				menu.showAtMouseEvent(evt);
			});
			this.ribbonIconEls.push(el);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
