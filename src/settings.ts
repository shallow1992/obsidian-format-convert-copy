import { App, Platform, PluginSettingTab, Setting, type SettingDefinitionItem } from "obsidian";
import type FormatConvertPlugin from "./main";
import { FormatConvertSettings } from "./types";
import { t } from "./i18n";

type BooleanSettingKey = {
	[K in keyof FormatConvertSettings]: FormatConvertSettings[K] extends boolean ? K : never;
}[keyof FormatConvertSettings];

type SettingKey = Extract<keyof FormatConvertSettings, string>;

export class FormatConvertSettingTab extends PluginSettingTab {
	plugin: FormatConvertPlugin;

	constructor(app: App, plugin: FormatConvertPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	override getControlValue(key: SettingKey): unknown {
		return this.plugin.settings[key];
	}

	override async setControlValue(key: SettingKey, value: unknown): Promise<void> {
		if (key === "emptySelectionBehavior") {
			if (value === "document" || value === "currentLine") {
				this.plugin.settings.emptySelectionBehavior = value;
			}
		} else {
			this.plugin.settings[key] = Boolean(value);
		}
		await this.plugin.saveSettings();
		if (key.startsWith("showRibbon")) {
			this.plugin.refreshRibbonIcons();
		}
	}

	override getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		const ribbonAreaName = Platform.isMobile
			? t("settingsRibbonHeadingMobile")
			: t("settingsRibbonHeadingDesktop");

		return [
			{
				type: "group",
				heading: ribbonAreaName,
				items: [
					{
						name: t("settingsRibbonSlackName"),
						desc: t("settingsRibbonSlackDesc", { area: ribbonAreaName }),
						control: { type: "toggle", key: "showRibbonSlackIcon" },
					},
					{
						name: t("settingsRibbonDiscordName"),
						desc: t("settingsRibbonDiscordDesc", { area: ribbonAreaName }),
						control: { type: "toggle", key: "showRibbonDiscordIcon" },
					},
					{
						name: t("settingsRibbonWhatsAppName"),
						desc: t("settingsRibbonWhatsAppDesc", { area: ribbonAreaName }),
						control: { type: "toggle", key: "showRibbonWhatsAppIcon" },
					},
					{
						name: t("settingsRibbonRawName"),
						desc: t("settingsRibbonRawDesc", { area: ribbonAreaName }),
						control: { type: "toggle", key: "showRibbonRawIcon" },
					},
					{
						name: t("settingsRibbonMenuName"),
						desc: t("settingsRibbonMenuDesc", { area: ribbonAreaName }),
						control: { type: "toggle", key: "showRibbonMenuIcon" },
					},
				],
			},
			{
				type: "group",
				heading: t("settingsFileHeading"),
				items: [
					{
						name: t("settingsFileSlackName"),
						desc: t("settingsFileSlackDesc"),
						control: { type: "toggle", key: "showFileSlackItem" },
					},
					{
						name: t("settingsFileDiscordName"),
						desc: t("settingsFileDiscordDesc"),
						control: { type: "toggle", key: "showFileDiscordItem" },
					},
					{
						name: t("settingsFileWhatsAppName"),
						desc: t("settingsFileWhatsAppDesc"),
						control: { type: "toggle", key: "showFileWhatsAppItem" },
					},
					{
						name: t("settingsFileRawName"),
						desc: t("settingsFileRawDesc"),
						control: { type: "toggle", key: "showFileRawItem" },
					},
					{
						name: t("settingsFileMenuName"),
						desc: t("settingsFileMenuDesc"),
						control: { type: "toggle", key: "showFileMenuItem" },
					},
				],
			},
			{
				type: "group",
				heading: t("settingsEditorHeading"),
				visible: !Platform.isMobile,
				items: [
					{
						name: t("settingsEditorSlackName"),
						control: { type: "toggle", key: "showSlackInMenu" },
					},
					{
						name: t("settingsEditorDiscordName"),
						control: { type: "toggle", key: "showDiscordInMenu" },
					},
					{
						name: t("settingsEditorWhatsAppName"),
						control: { type: "toggle", key: "showWhatsAppInMenu" },
					},
					{
						name: t("settingsEditorRawName"),
						control: { type: "toggle", key: "showRawInMenu" },
					},
					{
						name: t("settingsEditorMenuName"),
						desc: t("settingsEditorMenuDesc"),
						control: { type: "toggle", key: "showEditorMenuItem" },
					},
				],
			},
			{
				type: "group",
				heading: t("settingsBehaviorHeading"),
				items: [
					{
						name: t("settingsEmptySelectionName"),
						desc: t("settingsEmptySelectionDesc"),
						control: {
							type: "dropdown",
							key: "emptySelectionBehavior",
							options: {
								document: t("settingsEmptySelectionDoc"),
								currentLine: t("settingsEmptySelectionLine"),
							},
						},
					},
					{
						name: t("settingsShowNotificationName"),
						desc: t("settingsShowNotificationDesc"),
						control: { type: "toggle", key: "showNotification" },
					},
				],
			},
		];
	}

	private addToggleSetting(
		containerEl: HTMLElement,
		name: string,
		desc: string | undefined,
		key: BooleanSettingKey,
		afterChange?: () => void
	): Setting {
		const setting = new Setting(containerEl).setName(name);
		if (desc) {
			setting.setDesc(desc);
		}
		return setting.addToggle((toggle) =>
			toggle.setValue(this.plugin.settings[key]).onChange(async (value) => {
				this.plugin.settings[key] = value;
				await this.plugin.saveSettings();
				if (afterChange) {
					afterChange();
				}
			})
		);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const ribbonAreaName = Platform.isMobile
			? t("settingsRibbonHeadingMobile")
			: t("settingsRibbonHeadingDesktop");

		// ==========================================
		// 1. Navigation bar / ribbon settings
		// ==========================================
		new Setting(containerEl)
			.setName(ribbonAreaName)
			.setDesc(t("settingsRibbonDesc"))
			.setHeading();

		const ribbonToggles: { name: string; desc: string; key: BooleanSettingKey }[] = [
			{ name: t("settingsRibbonSlackName"), desc: t("settingsRibbonSlackDesc", { area: ribbonAreaName }), key: "showRibbonSlackIcon" },
			{ name: t("settingsRibbonDiscordName"), desc: t("settingsRibbonDiscordDesc", { area: ribbonAreaName }), key: "showRibbonDiscordIcon" },
			{ name: t("settingsRibbonWhatsAppName"), desc: t("settingsRibbonWhatsAppDesc", { area: ribbonAreaName }), key: "showRibbonWhatsAppIcon" },
			{ name: t("settingsRibbonRawName"), desc: t("settingsRibbonRawDesc", { area: ribbonAreaName }), key: "showRibbonRawIcon" },
			{ name: t("settingsRibbonMenuName"), desc: t("settingsRibbonMenuDesc", { area: ribbonAreaName }), key: "showRibbonMenuIcon" },
		];

		for (const item of ribbonToggles) {
			this.addToggleSetting(containerEl, item.name, item.desc, item.key, () => this.plugin.refreshRibbonIcons());
		}

		// ==========================================
		// 2. File explorer menu settings
		// ==========================================
		new Setting(containerEl)
			.setName(t("settingsFileHeading"))
			.setDesc(t("settingsFileDesc"))
			.setHeading();

		const fileToggles: { name: string; desc: string; key: BooleanSettingKey }[] = [
			{ name: t("settingsFileSlackName"), desc: t("settingsFileSlackDesc"), key: "showFileSlackItem" },
			{ name: t("settingsFileDiscordName"), desc: t("settingsFileDiscordDesc"), key: "showFileDiscordItem" },
			{ name: t("settingsFileWhatsAppName"), desc: t("settingsFileWhatsAppDesc"), key: "showFileWhatsAppItem" },
			{ name: t("settingsFileRawName"), desc: t("settingsFileRawDesc"), key: "showFileRawItem" },
			{ name: t("settingsFileMenuName"), desc: t("settingsFileMenuDesc"), key: "showFileMenuItem" },
		];

		for (const item of fileToggles) {
			this.addToggleSetting(containerEl, item.name, item.desc, item.key);
		}

		// ==========================================
		// 3. Desktop editor context menu settings
		// ==========================================
		if (!Platform.isMobile) {
			new Setting(containerEl)
				.setName(t("settingsEditorHeading"))
				.setDesc(t("settingsEditorDesc"))
				.setHeading();

			const editorToggles: { name: string; desc?: string; key: BooleanSettingKey }[] = [
				{ name: t("settingsEditorSlackName"), key: "showSlackInMenu" },
				{ name: t("settingsEditorDiscordName"), key: "showDiscordInMenu" },
				{ name: t("settingsEditorWhatsAppName"), key: "showWhatsAppInMenu" },
				{ name: t("settingsEditorRawName"), key: "showRawInMenu" },
				{ name: t("settingsEditorMenuName"), desc: t("settingsEditorMenuDesc"), key: "showEditorMenuItem" },
			];

			for (const item of editorToggles) {
				this.addToggleSetting(containerEl, item.name, item.desc, item.key);
			}
		}

		// ==========================================
		// 4. Copy behavior and notification settings
		// ==========================================
		new Setting(containerEl).setName(t("settingsBehaviorHeading")).setHeading();

		new Setting(containerEl)
			.setName(t("settingsEmptySelectionName"))
			.setDesc(t("settingsEmptySelectionDesc"))
			.addDropdown((dropdown) =>
				dropdown
					.addOption("document", t("settingsEmptySelectionDoc"))
					.addOption("currentLine", t("settingsEmptySelectionLine"))
					.setValue(this.plugin.settings.emptySelectionBehavior)
					.onChange(async (value) => {
						this.plugin.settings.emptySelectionBehavior = value as "document" | "currentLine";
						await this.plugin.saveSettings();
					})
			);

		this.addToggleSetting(
			containerEl,
			t("settingsShowNotificationName"),
			t("settingsShowNotificationDesc"),
			"showNotification"
		);
	}
}
