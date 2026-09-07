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

		containerEl.createEl("p", {
			text: "モバイルではエディタ選択時のコンテキストメニューに常に全項目が表示されます。ここではデスクトップの右クリックメニュー表示やリボンアイコンを設定できます。",
		});

		new Setting(containerEl)
			.setName("リボンアイコンを表示")
			.setDesc("画面左（モバイルではナビゲーションバー）にSlack形式コピーのリボンアイコンを追加します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcon();
				})
			);

		new Setting(containerEl)
			.setName("Slack形式を右クリックメニューに表示")
			.setDesc("デスクトップのエディタ右クリックメニューに「Slack形式でコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showSlackInMenu).onChange(async (value) => {
					this.plugin.settings.showSlackInMenu = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Discord形式を右クリックメニューに表示")
			.setDesc("デスクトップのエディタ右クリックメニューに「Discord形式でコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showDiscordInMenu).onChange(async (value) => {
					this.plugin.settings.showDiscordInMenu = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Markdownのままコピーを右クリックメニューに表示")
			.setDesc("デスクトップのエディタ右クリックメニューに「Markdownのままコピー」を表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRawInMenu).onChange(async (value) => {
					this.plugin.settings.showRawInMenu = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
