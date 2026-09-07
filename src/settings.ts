import { App, PluginSettingTab, Setting } from "obsidian";
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

		new Setting(containerEl)
			.setName("リボンアイコンを表示")
			.setDesc("画面左（モバイルではナビゲーションバー）に「形式を選択してコピー」のリボンアイコンを追加します。タップすると選択メニューが表示されます。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcon();
				})
			);

		new Setting(containerEl)
			.setName("Slack形式をメニューに表示")
			.setDesc("エディタのメニューおよびリボンメニューに「Slack形式でコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showSlackInMenu).onChange(async (value) => {
					this.plugin.settings.showSlackInMenu = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Discord形式をメニューに表示")
			.setDesc("エディタのメニューおよびリボンメニューに「Discord形式でコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showDiscordInMenu).onChange(async (value) => {
					this.plugin.settings.showDiscordInMenu = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Markdownのままコピーをメニューに表示")
			.setDesc("エディタのメニューおよびリボンメニューに「Markdownのままコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRawInMenu).onChange(async (value) => {
					this.plugin.settings.showRawInMenu = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
