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

		const ribbonAreaName = Platform.isMobile ? "ナビゲーションバー（モバイル）" : "画面左リボン（デスクトップ）";

		// ==========================================
		// 1. ナビゲーションバー / リボン設定
		// ==========================================
		new Setting(containerEl)
			.setName(`${ribbonAreaName}`)
			.setHeading()
			.setDesc("ワンタップで即座にコピーする直接アイコンや、全形式から選べるメニューアイコンを自由に配置できます。");

		new Setting(containerEl)
			.setName("「Slack形式でコピー」を直接配置")
			.setDesc(`${ribbonAreaName}にSlack直接コピーのアイコンを追加します。`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonSlackIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonSlackIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName("「Discord形式でコピー」を直接配置")
			.setDesc(`${ribbonAreaName}にDiscord直接コピーのアイコンを追加します。`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonDiscordIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonDiscordIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName("「WhatsApp形式でコピー」を直接配置")
			.setDesc(`${ribbonAreaName}にWhatsApp直接コピーのアイコンを追加します。`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showRibbonWhatsAppIcon).onChange(async (value) => {
					this.plugin.settings.showRibbonWhatsAppIcon = value;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcons();
				})
			);

		new Setting(containerEl)
			.setName("「Markdownのままコピー」を直接配置")
			.setDesc(`${ribbonAreaName}にMarkdown直接コピーのアイコンを追加します。`)
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

		// ==========================================
		// 2. ファイルエクスプローラメニュー設定（長押し / 右クリック）
		// ==========================================
		new Setting(containerEl)
			.setName("ファイルエクスプローラメニュー（長押し / 右クリック）")
			.setHeading()
			.setDesc("ファイル一覧でノートを長押し（PCでは右クリック）した際に表示する直接コピー項目や選択メニューを個別に設定できます。");

		new Setting(containerEl)
			.setName("「Slack形式でコピー」を直接表示")
			.setDesc("ファイルメニューにSlack直接コピーを表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileSlackItem).onChange(async (value) => {
					this.plugin.settings.showFileSlackItem = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("「Discord形式でコピー」を直接表示")
			.setDesc("ファイルメニューにDiscord直接コピーを表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileDiscordItem).onChange(async (value) => {
					this.plugin.settings.showFileDiscordItem = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("「WhatsApp形式でコピー」を直接表示")
			.setDesc("ファイルメニューにWhatsApp直接コピーを表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileWhatsAppItem).onChange(async (value) => {
					this.plugin.settings.showFileWhatsAppItem = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("「Markdownのままコピー」を直接表示")
			.setDesc("ファイルメニューにMarkdown直接コピーを表示します。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileRawItem).onChange(async (value) => {
					this.plugin.settings.showFileRawItem = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("「形式を選択してコピー」メニューを表示")
			.setDesc("ファイルメニューに選択メニュー項目を表示します（タップすると全形式から選べるシートを表示）。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showFileMenuItem).onChange(async (value) => {
					this.plugin.settings.showFileMenuItem = value;
					await this.plugin.saveSettings();
				})
			);

		// ==========================================
		// 3. デスクトップ版エディタ右クリックメニュー設定
		// ==========================================
		if (!Platform.isMobile) {
			new Setting(containerEl)
				.setName("エディタ右クリックメニュー（デスクトップ）")
				.setHeading();

			new Setting(containerEl)
				.setName("Slack形式を表示")
				.setDesc("エディタ右クリックメニューに「Slack形式でコピー」を表示します。")
				.addToggle((toggle) =>
					toggle.setValue(this.plugin.settings.showSlackInMenu).onChange(async (value) => {
						this.plugin.settings.showSlackInMenu = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(containerEl)
				.setName("Discord形式を表示")
				.setDesc("エディタ右クリックメニューに「Discord形式でコピー」を表示します。")
				.addToggle((toggle) =>
					toggle.setValue(this.plugin.settings.showDiscordInMenu).onChange(async (value) => {
						this.plugin.settings.showDiscordInMenu = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(containerEl)
				.setName("WhatsApp形式を表示")
				.setDesc("エディタ右クリックメニューに「WhatsApp形式でコピー」を表示します。")
				.addToggle((toggle) =>
					toggle.setValue(this.plugin.settings.showWhatsAppInMenu).onChange(async (value) => {
						this.plugin.settings.showWhatsAppInMenu = value;
						await this.plugin.saveSettings();
					})
				);

			new Setting(containerEl)
				.setName("Markdownのままコピーを表示")
				.setDesc("エディタ右クリックメニューに「Markdownのままコピー」を表示します。")
				.addToggle((toggle) =>
					toggle.setValue(this.plugin.settings.showRawInMenu).onChange(async (value) => {
						this.plugin.settings.showRawInMenu = value;
						await this.plugin.saveSettings();
					})
				);
		}

		// ==========================================
		// 4. コピー動作設定
		// ==========================================
		new Setting(containerEl)
			.setName("コピー動作設定")
			.setHeading();

		new Setting(containerEl)
			.setName("未選択時のコピー対象")
			.setDesc("エディタ内でテキストを選択していない場合に、何をコピーするかを選択します。")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("document", "ノート全体（全文）")
					.addOption("currentLine", "カーソル行（現在の1行）")
					.setValue(this.plugin.settings.emptySelectionBehavior)
					.onChange(async (value) => {
						this.plugin.settings.emptySelectionBehavior = value as "document" | "currentLine";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("サイレントモード（完了通知を非表示）")
			.setDesc("コピー成功時に画面上部に表示される通知トースト（Notice）を非表示にします。頻繁にコピーする際の中断を防止できます（エラー時は通知されます）。")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.silentMode).onChange(async (value) => {
					this.plugin.settings.silentMode = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
