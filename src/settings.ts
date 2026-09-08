import { App, Platform, PluginSettingTab, Setting } from "obsidian";
import type FormatConvertPlugin from "./main";
import { FormatConvertSettings } from "./types";
import { t } from "./i18n";

export class FormatConvertSettingTab extends PluginSettingTab {
	plugin: FormatConvertPlugin;

	constructor(app: App, plugin: FormatConvertPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private addToggleSetting(
		containerEl: HTMLElement,
		name: string,
		desc: string | undefined,
		key: keyof FormatConvertSettings,
		afterChange?: () => void
	): Setting {
		const setting = new Setting(containerEl).setName(name);
		if (desc) {
			setting.setDesc(desc);
		}
		return setting.addToggle((toggle) =>
			toggle.setValue(Boolean(this.plugin.settings[key])).onChange(async (value) => {
				(this.plugin.settings as any)[key] = value;
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
		containerEl.createEl("h3", { text: ribbonAreaName, cls: "format-convert-setting-heading" });
		containerEl.createEl("p", { text: t("settingsRibbonDesc"), cls: "setting-item-description format-convert-setting-desc" });

		const ribbonToggles: { name: string; desc: string; key: keyof FormatConvertSettings }[] = [
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
		containerEl.createEl("h3", { text: t("settingsFileHeading"), cls: "format-convert-setting-heading" });
		containerEl.createEl("p", { text: t("settingsFileDesc"), cls: "setting-item-description format-convert-setting-desc" });

		const fileToggles: { name: string; desc: string; key: keyof FormatConvertSettings }[] = [
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
			containerEl.createEl("h3", { text: t("settingsEditorHeading"), cls: "format-convert-setting-heading" });
			containerEl.createEl("p", { text: t("settingsEditorDesc"), cls: "setting-item-description format-convert-setting-desc" });

			const editorToggles: { name: string; key: keyof FormatConvertSettings }[] = [
				{ name: t("settingsEditorSlackName"), key: "showSlackInMenu" },
				{ name: t("settingsEditorDiscordName"), key: "showDiscordInMenu" },
				{ name: t("settingsEditorWhatsAppName"), key: "showWhatsAppInMenu" },
				{ name: t("settingsEditorRawName"), key: "showRawInMenu" },
			];

			for (const item of editorToggles) {
				this.addToggleSetting(containerEl, item.name, undefined, item.key);
			}
		}

		// ==========================================
		// 4. Copy behavior and notification settings
		// ==========================================
		containerEl.createEl("h3", { text: t("settingsBehaviorHeading"), cls: "format-convert-setting-heading" });

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
			t("settingsSilentModeName"),
			t("settingsSilentModeDesc"),
			"silentMode"
		);
	}
}
