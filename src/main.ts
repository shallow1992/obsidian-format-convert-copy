import { App, Editor, MarkdownView, Menu, Notice, Platform, Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { convertMarkdown } from "./converters";
import { convertToSlackTexty } from "./converters/slackTexty";
import { FormatConvertSettingTab } from "./settings";
import { DEFAULT_SETTINGS, EmptySelectionBehavior, FormatConvertSettings, FormatType, FORMAT_DEFINITIONS, getFormatItems } from "./types";
import { copyToClipboard } from "./utils/clipboard";
import { FormatSelectModal } from "./ui/formatSelectModal";
import { t } from "./i18n";

export function getVisibleMarkdownLeaves(app: App): WorkspaceLeaf[] {
	const leaves = app.workspace.getLeavesOfType("markdown");
	return leaves.filter((leaf) => {
		const el = leaf.view?.containerEl;
		if (!el) return false;
		return el.offsetParent !== null;
	});
}

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
				callback: async () => {
					const target = await this.resolveTargetText();
					if (!target) return;
					void this.convertAndCopy(target, def.id);
				},
			});
		}

		// Show format selection modal command (command palette, Commander, or shortcuts)
		this.addCommand({
			id: "convert-select-menu",
			name: t("cmdMenu"),
			icon: "copy",
			callback: async () => {
				const target = await this.resolveTargetText();
				if (!target) return;
				new FormatSelectModal(this.app, (item) => {
					void this.convertAndCopy(target, item.id);
				}).open();
			},
		});

		// Command to copy as Slack plain text / mrkdwn without HTML (v0.3.20 compatibility mode)
		this.addCommand({
			id: "copy-slack-plain-mode",
			name: "Format Convert: Copy as Slack (Plain Text)",
			icon: "history",
			callback: async () => {
				const target = await this.resolveTargetText();
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
					menu.addItem((item) => {
						item.setTitle(t("actionChooseMenu")).setIcon("copy");
						if (typeof item.setSubmenu === "function") {
							const submenu = item.setSubmenu();
							this.populateFormatSubmenu(submenu, (type) => {
								void this.convertAndCopy(target, type);
							});
						} else {
							item.onClick(() => {
								new FormatSelectModal(this.app, (chosen) => {
									void this.convertAndCopy(target, chosen.id);
								}).open();
							});
						}
					});
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
					menu.addItem((item) => {
						item.setTitle(t("actionChooseMenu")).setIcon("copy");
						if (typeof item.setSubmenu === "function") {
							const submenu = item.setSubmenu();
							this.populateFormatSubmenu(submenu, (type) => {
								void copyFileContent(type);
							});
						} else {
							item.onClick(() => {
								new FormatSelectModal(this.app, (chosen) => {
									void copyFileContent(chosen.id);
								}).open();
							});
						}
					});
				}
			})
		);
	}

	refreshRibbonIcons(): void {
		this.removeAllRibbonIcons();

		const activeCopy = async (type: FormatType) => {
			const target = await this.resolveTargetText();
			if (target) {
				void this.convertAndCopy(target, type);
			}
		};

		for (const def of FORMAT_DEFINITIONS) {
			if (this.settings[def.settings.ribbon]) {
				this.ribbonIconEls.push(
					this.addRibbonIcon(def.icon, t(def.actionKey), () => void activeCopy(def.id))
				);
			}
		}

		// Format selection modal (unified with command palette and Commander)
		if (this.settings.showRibbonMenuIcon) {
			this.ribbonIconEls.push(
				this.addRibbonIcon("copy", t("actionChooseMenu"), async () => {
					const target = await this.resolveTargetText();
					if (!target) return;
					new FormatSelectModal(this.app, (chosen) => {
						void this.convertAndCopy(target, chosen.id);
					}).open();
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

	populateFormatSubmenu(
		menu: Menu,
		onSelect: (type: FormatType) => void
	): void {
		for (const item of getFormatItems()) {
			menu.addItem((subItem) =>
				subItem
					.setTitle(item.label)
					.setIcon(item.icon)
					.onClick(() => onSelect(item.id))
			);
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

	async resolveTargetText(): Promise<string | null> {
		// 1. If an active editor is focused, use it immediately (even in split view)
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView?.editor) {
			const target = this.getTargetText(activeView.editor);
			if (target) {
				return target;
			}
		}

		// 2. Inspect all visible Markdown leaves on screen when active focus is outside editors
		const visibleLeaves = getVisibleMarkdownLeaves(this.app);

		// Prioritize selected text in any visible markdown editor even without active focus
		for (const leaf of visibleLeaves) {
			const view = leaf.view;
			if (view instanceof MarkdownView && view.editor) {
				const selection = view.editor.getSelection();
				if (selection.trim().length > 0) {
					return selection;
				}
			}
		}

		// 3. Handle cases where no text is selected and focus is outside editors
		if (visibleLeaves.length === 0) {
			const file = this.app.workspace.getActiveFile();
			if (file && file.extension === "md") {
				try {
					return await this.app.vault.cachedRead(file);
				} catch {
					new Notice(t("noticeReadFailed"));
					return null;
				}
			}
			new Notice(t("noticeNoActiveNote"));
			return null;
		}

		if (visibleLeaves.length > 1) {
			new Notice(t("noticeSplitAmbiguous"));
			return null;
		}

		// 4. Exactly one visible leaf: extract document/line content
		const singleLeaf = visibleLeaves[0];
		const view = singleLeaf.view;
		if (view instanceof MarkdownView && view.editor) {
			return this.getTargetText(view.editor);
		}

		new Notice(t("noticeNoActiveNote"));
		return null;
	}

	async getActiveTargetText(): Promise<string | null> {
		return this.resolveTargetText();
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
