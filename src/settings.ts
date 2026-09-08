import { App, Platform, PluginSettingTab, Setting } from "obsidian";
import type FormatConvertPlugin from "./main";
import { t } from "./i18n";

export class FormatConvertSettingTab extends PluginSettingTab {
	plugin: FormatConvertPlugin;

	constructor(app: App, plugin: FormatConvertPlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
			.setHeading()
			.setDesc(t("settingsRibbonDesc"));

		new Setting(containerEl)
			.setName(t("settingsRibbonSlackName"))
			.setDesc(t("settingsRibbonSlackDesc", { area: ribbonAreaName }))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonSlackIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonSlackIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName(t("settingsRibbonDiscordName"))
			.setDesc(t("settingsRibbonDiscordDesc", { area: ribbonAreaName }))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonDiscordIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonDiscordIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName(t("settingsRibbonWhatsAppName"))
			.setDesc(t("settingsRibbonWhatsAppDesc", { area: ribbonAreaName }))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonWhatsAppIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonWhatsAppIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName(t("settingsRibbonRawName"))
			.setDesc(t("settingsRibbonRawDesc", { area: ribbonAreaName }))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonRawIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonRawIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName(t("settingsRibbonMenuName"))
			.setDesc(t("settingsRibbonMenuDesc", { area: ribbonAreaName }))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonMenuIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonMenuIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		// ==========================================
		// 2. File explorer menu settings
		// ==========================================
		new Setting(containerEl)
			.setName(t("settingsFileHeading"))
			.setHeading()
			.setDesc(t("settingsFileDesc"));

		new Setting(containerEl)
			.setName(t("settingsFileMenuName"))
			.setDesc(t("settingsFileMenuDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileMenuItem).onChange(async (value) => {
					this.plugin.settings.showFileMenuItem = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(t("settingsFileSlackName"))
			.setDesc(t("settingsFileSlackDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileSlackItem).onChange(async (value) => {
					this.plugin.settings.showFileSlackItem = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(t("settingsFileDiscordName"))
			.setDesc(t("settingsFileDiscordDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileDiscordItem).onChange(async (value) => {
					this.plugin.settings.showFileDiscordItem = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(t("settingsFileWhatsAppName"))
			.setDesc(t("settingsFileWhatsAppDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileWhatsAppItem).onChange(async (value) => {
					this.plugin.settings.showFileWhatsAppItem = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName(t("settingsFileRawName"))
			.setDesc(t("settingsFileRawDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileRawItem).onChange(async (value) => {
					this.plugin.settings.showFileRawItem = value;
					await this.plugin.saveSettings();
				})
			);

		// ==========================================
		// 3. Desktop editor context menu settings
		// ==========================================
		if (!Platform.isMobile) {
			new Setting(containerEl)
				.setName(t("settingsEditorHeading"))
				.setHeading()
				.setDesc(t("settingsEditorDesc"));

			new Setting(containerEl)
				.setName(t("settingsEditorSlackName"))
				.addToggle((toggle) =>
					toggle.setValue(this.plugin.settings.showSlackInMenu).onChange(async (value) => {
						this.plugin.settings.showSlackInMenu = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(containerEl)
				.setName(t("settingsEditorDiscordName"))
				.addToggle((toggle) =>
					toggle.setValue(this.plugin.settings.showDiscordInMenu).onChange(async (value) => {
						this.plugin.settings.showDiscordInMenu = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(containerEl)
				.setName(t("settingsEditorWhatsAppName"))
				.addToggle((toggle) =>
					toggle.setValue(this.plugin.settings.showWhatsAppInMenu).onChange(async (value) => {
						this.plugin.settings.showWhatsAppInMenu = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(containerEl)
				.setName(t("settingsEditorRawName"))
				.addToggle((toggle) =>
					toggle.setValue(this.plugin.settings.showRawInMenu).onChange(async (value) => {
						this.plugin.settings.showRawInMenu = value;
						await this.plugin.saveSettings();
					})
				);
		}

		// ==========================================
		// 4. Copy behavior and notification settings
		// ==========================================
		new Setting(containerEl)
			.setName(t("settingsBehaviorHeading"))
			.setHeading();

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

		new Setting(containerEl)
			.setName(t("settingsSilentModeName"))
			.setDesc(t("settingsSilentModeDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.silentMode).onChange(async (value) => {
					this.plugin.settings.silentMode = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
