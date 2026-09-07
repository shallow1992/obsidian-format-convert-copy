import { Editor, MarkdownView, Menu, Notice, Platform, Plugin, TFile } from "obsidian";
import { convertMarkdown } from "./converters";
import { FormatConvertSettingTab } from "./settings";
import { DEFAULT_SETTINGS, EmptySelectionBehavior, FORMAT_ITEMS, FormatConvertSettings, FormatType } from "./types";
import { copyToClipboard } from "./utils/clipboard";

export function getTargetText(
	editor?: Editor | null,
	behavior: EmptySelectionBehavior = "document"
): string {
	if (!editor) return "";
	const selection = editor.getSelection();
	if (selection.trim().length > 0) return selection;
	if (behavior === "currentLine") {
		const cursor = editor.getCursor();
		return editor.getLine(cursor.line);
	}
	return editor.getValue();
}

export default class FormatConvertPlugin extends Plugin {
	settings!: FormatConvertSettings;
	ribbonIconEls: HTMLElement[] = [];

	async onload(): Promise<void> {
		await this.loadSettings();

		// 1. コマンドパレット・ショートカット（PC・モバイル共通）
		this.registerCommands();

		// 2. エディタコンテキストメニュー（デスクトップ版PCのみ）
		if (!Platform.isMobile) {
			this.registerEditorMenu();
		}

		// 3. ファイルエクスプローラ長押し / 右クリックメニュー (PC & iOS/Mobile共通)
		this.registerFileMenu();

		// 4. ナビゲーションバー / リボンアイコンの初期化
		this.refreshRibbonIcons();

		// 5. 設定画面タブの追加
		this.addSettingTab(new FormatConvertSettingTab(this.app, this));
	}

	onunload(): void {
		this.removeAllRibbonIcons();
	}

	// ----------------------------------------------------
	// 登録処理 (Commands, Menus, Ribbons)
	// ----------------------------------------------------

	private registerCommands(): void {
		const commands: { id: string; name: string; type: FormatType; icon: string }[] = [
			{ id: "convert-slack", name: "Slack形式に変換してコピー", type: "slack", icon: "share-2" },
			{ id: "convert-discord", name: "Discord形式に変換してコピー", type: "discord", icon: "message-square" },
			{ id: "convert-whatsapp", name: "WhatsApp形式に変換してコピー", type: "whatsapp", icon: "message-circle" },
			{ id: "copy-raw-markdown", name: "Markdownのままコピー", type: "raw", icon: "file-text" },
		];

		for (const cmd of commands) {
			this.addCommand({
				id: cmd.id,
				name: cmd.name,
				icon: cmd.icon,
				editorCallback: (editor: Editor) => {
					const target = this.getTargetText(editor);
					const result = convertMarkdown(target, cmd.type);
					copyToClipboard(result.text, result.label, result.html);
				},
			});
		}

		// 形式選択メニュー表示コマンド（モバイルキーボードツールバーやコマンドパレットから1タップで選択シートを表示）
		this.addCommand({
			id: "convert-select-menu",
			name: "形式を選択してコピー（メニュー表示）",
			icon: "copy",
			editorCallback: (editor: Editor) => {
				const target = this.getTargetText(editor);
				if (!target) return;
				this.showFormatSelectMenu(
					{ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 } as any,
					(type) => {
						const result = convertMarkdown(target, type);
						copyToClipboard(result.text, result.label, result.html);
					}
				);
			},
		});
	}

	private registerEditorMenu(): void {
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
				const target = this.getTargetText(editor);

				const menuConfigs: { enabled: boolean; type: FormatType; title: string }[] = [
					{ enabled: this.settings.showSlackInMenu, type: "slack", title: "Slack形式でコピー" },
					{ enabled: this.settings.showDiscordInMenu, type: "discord", title: "Discord形式でコピー" },
					{ enabled: this.settings.showWhatsAppInMenu, type: "whatsapp", title: "WhatsApp形式でコピー" },
					{ enabled: this.settings.showRawInMenu, type: "raw", title: "Markdownのままコピー" },
				];

				for (const item of menuConfigs) {
					if (item.enabled) {
						menu.addItem((menuItem) =>
							menuItem
								.setTitle(item.title)
								.setIcon("clipboard-copy")
								.onClick(() => {
									const result = convertMarkdown(target, item.type);
									copyToClipboard(result.text, result.label, result.html);
								})
						);
					}
				}
			})
		);
	}

	private registerFileMenu(): void {
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu: Menu, file) => {
				if (!(file instanceof TFile) || file.extension !== "md") {
					return;
				}

				const copyFileContent = async (type: FormatType) => {
					try {
						const content = await this.app.vault.cachedRead(file);
						const result = convertMarkdown(content, type);
						await copyToClipboard(result.text, result.label, result.html);
					} catch (_e) {
						new Notice("クリップボードへのコピーに失敗しました");
					}
				};

				// 直接コピー項目の登録
				const directItems: { enabled: boolean; type: FormatType; title: string }[] = [
					{ enabled: this.settings.showFileSlackItem, type: "slack", title: "Slack形式でコピー" },
					{ enabled: this.settings.showFileDiscordItem, type: "discord", title: "Discord形式でコピー" },
					{ enabled: this.settings.showFileWhatsAppItem, type: "whatsapp", title: "WhatsApp形式でコピー" },
					{ enabled: this.settings.showFileRawItem, type: "raw", title: "Markdownのままコピー" },
				];

				for (const item of directItems) {
					if (item.enabled) {
						menu.addItem((menuItem) =>
							menuItem
								.setTitle(item.title)
								.setIcon("clipboard-copy")
								.onClick(() => copyFileContent(item.type))
						);
					}
				}

				// 形式選択メニュー項目の登録
				if (this.settings.showFileMenuItem) {
					menu.addItem((item) =>
						item
							.setTitle("形式を選択してコピー")
							.setIcon("copy")
							.onClick((evt: MouseEvent | KeyboardEvent) => {
								this.showFormatSelectMenu(evt, (type) => copyFileContent(type));
							})
					);
				}
			})
		);
	}

	refreshRibbonIcons(): void {
		this.removeAllRibbonIcons();

		const activeCopy = (type: FormatType) => {
			const target = this.getActiveTargetText();
			if (target) {
				const result = convertMarkdown(target, type);
				copyToClipboard(result.text, result.label, result.html);
			}
		};

		// 1. Slack直接
		if (this.settings.showRibbonSlackIcon) {
			this.ribbonIconEls.push(
				this.addRibbonIcon("share-2", "Slack形式でコピー", () => activeCopy("slack"))
			);
		}

		// 2. Discord直接
		if (this.settings.showRibbonDiscordIcon) {
			this.ribbonIconEls.push(
				this.addRibbonIcon("message-square", "Discord形式でコピー", () => activeCopy("discord"))
			);
		}

		// 3. WhatsApp直接
		if (this.settings.showRibbonWhatsAppIcon) {
			this.ribbonIconEls.push(
				this.addRibbonIcon("message-circle", "WhatsApp形式でコピー", () => activeCopy("whatsapp"))
			);
		}

		// 4. Markdown直接
		if (this.settings.showRibbonRawIcon) {
			this.ribbonIconEls.push(
				this.addRibbonIcon("file-text", "Markdownのままコピー", () => activeCopy("raw"))
			);
		}

		// 5. 全形式選択メニュー
		if (this.settings.showRibbonMenuIcon) {
			this.ribbonIconEls.push(
				this.addRibbonIcon("copy", "形式を選択してコピー", (evt: MouseEvent) => {
					if (!this.getActiveTargetText()) return;
					this.showFormatSelectMenu(evt, (type) => activeCopy(type));
				})
			);
		}
	}

	removeAllRibbonIcons(): void {
		for (const el of this.ribbonIconEls) {
			el.remove();
		}
		this.ribbonIconEls = [];
	}

	private showFormatSelectMenu(
		evt: MouseEvent | KeyboardEvent,
		onSelect: (type: FormatType) => void
	): void {
		const formatMenu = new Menu();

		for (const item of FORMAT_ITEMS) {
			formatMenu.addItem((subItem) =>
				subItem
					.setTitle(item.label)
					.setIcon(item.icon)
					.onClick(() => onSelect(item.id))
			);
		}

		if ("clientX" in evt && "clientY" in evt) {
			formatMenu.showAtPosition({ x: evt.clientX, y: evt.clientY });
		} else {
			formatMenu.showAtPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
		}
	}

	getTargetText(editor?: Editor | null): string {
		return getTargetText(editor, this.settings.emptySelectionBehavior);
	}

	getActiveTargetText(): string | null {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = activeView?.editor;
		const target = this.getTargetText(editor);
		if (!target) {
			new Notice("アクティブなノートまたは選択テキストがありません");
			return null;
		}
		return target;
	}

	// ----------------------------------------------------
	// 設定の永続化 (Deep Merge パターン)
	// ----------------------------------------------------

	async loadSettings(): Promise<void> {
		const loadedData = await this.loadData();
		this.settings = {
			...DEFAULT_SETTINGS,
			...loadedData,
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
