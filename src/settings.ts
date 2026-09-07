import { App, Platform, PluginSettingTab, Setting } from "obsidian";
import type FormatConvertPlugin from "./main";

export class FormatConvertSettingTab extends PluginSettingTab {
	plugin: FormatConvertPlugin;

	constructor(app: App, plugin: FormatConvertPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Format Convert Settings" });

		const ribbonAreaName = Platform.isMobile ? "ナビゲーションバー" : "画面左リボン";

		// --- ナビゲーションバー / リボン設定 ---
		containerEl.createEl("h3", { text: `${ribbonAreaName}（直接コピー / メニュー）` });

		new Setting(containerEl)
			.setName("「Slack形式でコピー」を直接配置")
			.setDesc(`${ribbonAreaName}にSlack直接コピーのアイコンを追加します（ワンタップでコピー）。`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonSlackIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonSlackIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName("「Discord形式でコピー」を直接配置")
			.setDesc(`${ribbonAreaName}にDiscord直接コピーのアイコンを追加します（ワンタップでコピー）。`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonDiscordIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonDiscordIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName("「Markdownのままコピー」を直接配置")
			.setDesc(`${ribbonAreaName}にMarkdown直接コピーのアイコンを追加します（ワンタップでコピー）。`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonRawIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonRawIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName("「形式を選択してコピー」メニューを配置")
			.setDesc(`${ribbonAreaName}に選択メニュー表示のアイコンを追加します（タップすると全形式から選べるシートを表示）。`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonMenuIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonMenuIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		// --- エディタコンテキストメニュー設定 ---
		containerEl.createEl("h3", { text: "エディタ選択メニュー（右クリック / 長押し）" });

		new Setting(containerEl)
			.setName("Slack形式を表示")
			.setDesc("エディタの選択メニューに「Slack形式でコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showSlackInMenu).onChange(async (value) => {
					this.plugin.settings.showSlackInMenu = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Discord形式を表示")
			.setDesc("エディタの選択メニューに「Discord形式でコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showDiscordInMenu).onChange(async (value) => {
					this.plugin.settings.showDiscordInMenu = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Markdownのままコピーを表示")
			.setDesc("エディタの選択メニューに「Markdownのままコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRawInMenu).onChange(async (value) => {
					this.plugin.settings.showRawInMenu = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
