import { Editor, MarkdownView, Menu, Notice, Platform, Plugin, TFile } from "obsidian";
import { convertMarkdown } from "./converters";
import { convertToSlackTexty } from "./converters/slackTexty";
import { FormatConvertSettingTab } from "./settings";
import { DEFAULT_SETTINGS, EmptySelectionBehavior, FormatConvertSettings, FormatType, FORMAT_DEFINITIONS, getFormatItems } from "./types";
import { copyToClipboard } from "./utils/clipboard";
import { t } from "./i18n";

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

		// 1. Command palette & shortcuts (desktop & mobile)
		this.registerCommands();

		// 2. Editor context menu (desktop only)
		if (!Platform.isMobile) {
			this.registerEditorMenu();
		}

		// 3. File explorer long-press / right-click menu (desktop & mobile)
		this.registerFileMenu();

		// 4. Initialize navigation bar / ribbon icons
		this.refreshRibbonIcons();

		// 5. Add settings tab
		this.addSettingTab(new FormatConvertSettingTab(this.app, this));
	}

	onunload(): void {
		this.removeAllRibbonIcons();
	}

	// ----------------------------------------------------
	// Registrations (Commands, Menus, Ribbons)
	// ----------------------------------------------------

	private registerCommands(): void {
		for (const def of FORMAT_DEFINITIONS) {
			this.addCommand({
				id: def.commandId,
				name: t(def.cmdKey),
				icon: def.icon,
				editorCallback: (editor: Editor) => {
					const target = this.getTargetText(editor);
					void this.convertAndCopy(target, def.id);
				},
			});
		}

		// Show format selection menu command (one-tap sheet for mobile keyboard toolbar or command palette)
		this.addCommand({
			id: "convert-select-menu",
			name: t("cmdMenu"),
			icon: "copy",
			editorCallback: (editor: Editor) => {
				const target = this.getTargetText(editor);
				if (!target) return;
				this.showFormatSelectMenu(
					{ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 },
					(type) => {
						void this.convertAndCopy(target, type);
					}
				);
			},
		});

		// Command to copy as Slack plain text / mrkdwn without HTML (v0.3.20 compatibility mode)
		this.addCommand({
			id: "copy-slack-plain-mode",
			name: "Format Convert: Copy as Slack (Plain Text)",
			icon: "history",
			editorCallback: async (editor: Editor) => {
				const target = this.getTargetText(editor);
				if (!target) return;
				const res = convertToSlackTexty(target);
				await copyToClipboard(
					res.plain,
					"Slack (Plain Text)",
					undefined,
					false,
					{
						"slack/texty": res.texty,
						"text/markdown": res.markdown,
					}
				);
			},
		});
	}

	private registerEditorMenu(): void {
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
				const target = this.getTargetText(editor);

				for (const def of FORMAT_DEFINITIONS) {
					if (this.settings[def.settings.editor]) {
						menu.addItem((menuItem) =>
							menuItem
								.setTitle(t(def.actionKey))
								.setIcon("clipboard-copy")
								.onClick(() => {
									void this.convertAndCopy(target, def.id);
								})
						);
					}
				}

				if (this.settings.showEditorMenuItem) {
					menu.addItem((item) =>
						item
							.setTitle(t("actionChooseMenu"))
							.setIcon("copy")
							.onClick((evt: MouseEvent | KeyboardEvent) => {
								this.showFormatSelectMenu(evt, (type) => {
									void this.convertAndCopy(target, type);
								});
							})
					);
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
						await this.convertAndCopy(content, type);
					} catch {
						new Notice(t("noticeFailed"));
					}
				};

				for (const def of FORMAT_DEFINITIONS) {
					if (this.settings[def.settings.file]) {
						menu.addItem((menuItem) =>
							menuItem
								.setTitle(t(def.actionKey))
								.setIcon("clipboard-copy")
								.onClick(() => {
									void copyFileContent(def.id);
								})
						);
					}
				}

				// Register format selection menu item
				if (this.settings.showFileMenuItem) {
					menu.addItem((item) =>
						item
							.setTitle(t("actionChooseMenu"))
							.setIcon("copy")
							.onClick((evt: MouseEvent | KeyboardEvent) => {
								this.showFormatSelectMenu(evt, (type) => {
									void copyFileContent(type);
								});
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
				void this.convertAndCopy(target, type);
			}
		};

		for (const def of FORMAT_DEFINITIONS) {
			if (this.settings[def.settings.ribbon]) {
				this.ribbonIconEls.push(
					this.addRibbonIcon(def.icon, t(def.actionKey), () => activeCopy(def.id))
				);
			}
		}

		// Format selection menu
		if (this.settings.showRibbonMenuIcon) {
			this.ribbonIconEls.push(
				this.addRibbonIcon("copy", t("actionChooseMenu"), (evt: MouseEvent) => {
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
		evt: MouseEvent | KeyboardEvent | { clientX: number; clientY: number },
		onSelect: (type: FormatType) => void
	): void {
		const formatMenu = new Menu();

		for (const item of getFormatItems()) {
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

	async convertAndCopy(text: string, type: FormatType): Promise<boolean> {
		const result = convertMarkdown(text, type);
		return this.copyResult(result.text, result.label, result.html, result.customMimeTypes);
	}

	async copyResult(
		text: string,
		label: string,
		html?: string,
		customMimeTypes?: Record<string, string>
	): Promise<boolean> {
		return copyToClipboard(text, label, html, this.settings.showNotification, customMimeTypes);
	}

	getTargetText(editor?: Editor | null): string {
		return getTargetText(editor, this.settings.emptySelectionBehavior);
	}

	getActiveTargetText(): string | null {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = activeView?.editor;
		const target = this.getTargetText(editor);
		if (!target) {
			new Notice(t("noticeNoActiveNote"));
			return null;
		}
		return target;
	}

	// ----------------------------------------------------
	// Settings persistence (deep merge pattern)
	// ----------------------------------------------------

	async loadSettings(): Promise<void> {
		const loadedData = (await this.loadData()) as (Partial<FormatConvertSettings> & { silentMode?: boolean }) | null;
		const settings: FormatConvertSettings = {
			...DEFAULT_SETTINGS,
			...(loadedData ?? {}),
		};

		// Migration: silentMode -> showNotification
		if (loadedData && typeof loadedData.silentMode === "boolean" && loadedData.showNotification === undefined) {
			settings.showNotification = !loadedData.silentMode;
			delete (settings as { silentMode?: boolean }).silentMode;
		}

		this.settings = settings;
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
