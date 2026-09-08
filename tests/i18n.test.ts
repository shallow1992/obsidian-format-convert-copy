import { describe, expect, it, afterEach } from "vitest";
import { getCurrentLocale, setLocaleForTesting, t } from "../src/i18n";
import { getFormatItems } from "../src/types";

describe("i18n localization", () => {
	afterEach(() => {
		setLocaleForTesting(null);
	});

	it("returns English strings by default when locale is en", () => {
		setLocaleForTesting("en");
		expect(getCurrentLocale()).toBe("en");
		expect(t("cmdSlack")).toBe("Convert and copy for Slack");
		expect(t("cmdDiscord")).toBe("Convert and copy for Discord");
		expect(t("cmdWhatsApp")).toBe("Convert and copy for WhatsApp");
		expect(t("cmdRaw")).toBe("Copy as raw Markdown");
		expect(t("cmdMenu")).toBe("Choose format and copy (Show menu)");
		expect(t("noticeCopied", { format: "Slack" })).toBe("Copied for Slack");
		expect(t("noticeCopiedSimple", { format: "Slack" })).toBe("Copied for Slack (plain text)");
		expect(t("noticeFailed")).toBe("Failed to copy to clipboard");
		expect(t("settingsEmptySelectionDoc")).toBe("Entire note (default)");
		expect(t("settingsEmptySelectionLine")).toBe("Current line (cursor line)");
		expect(t("settingsRibbonSlackName")).toBe("Slack format");
		expect(t("settingsFileMenuName")).toBe("Format selection menu");
		expect(t("settingsSilentModeName")).toBe("Silent mode");
	});

	it("returns Japanese strings when locale is ja", () => {
		setLocaleForTesting("ja");
		expect(getCurrentLocale()).toBe("ja");
		expect(t("cmdSlack")).toBe("Slack形式に変換してコピー");
		expect(t("cmdDiscord")).toBe("Discord形式に変換してコピー");
		expect(t("cmdWhatsApp")).toBe("WhatsApp形式に変換してコピー");
		expect(t("cmdRaw")).toBe("Markdown形式でコピー");
		expect(t("cmdMenu")).toBe("形式を選択してコピー");
		expect(t("actionCopyRaw")).toBe("Markdown形式でコピー");
		expect(t("actionChooseMenu")).toBe("形式を選択してコピー");
		expect(t("noticeCopied", { format: "Slack" })).toBe("Slack形式でコピーしました");
		expect(t("noticeCopiedSimple", { format: "Slack" })).toBe("Slack形式でコピーしました（簡易版）");
		expect(t("noticeFailed")).toBe("クリップボードへのコピーに失敗しました");
		expect(t("settingsEmptySelectionDoc")).toBe("ノート全体（全文）");
		expect(t("settingsEmptySelectionLine")).toBe("カーソル行（現在の1行）");
		expect(t("settingsRibbonSlackName")).toBe("Slack形式");
		expect(t("settingsFileMenuName")).toBe("形式選択メニュー");
		expect(t("settingsSilentModeName")).toBe("サイレントモード");
	});

	it("falls back to English for unsupported locales", () => {
		setLocaleForTesting("de");
		expect(t("cmdSlack")).toBe("Convert and copy for Slack");
		expect(t("noticeFailed")).toBe("Failed to copy to clipboard");
	});

	it("correctly localizes getFormatItems() based on active locale", () => {
		setLocaleForTesting("ja");
		const jaItems = getFormatItems();
		expect(jaItems[0].label).toBe("Slack形式でコピー");
		expect(jaItems[1].label).toBe("Discord形式でコピー");

		setLocaleForTesting("en");
		const enItems = getFormatItems();
		expect(enItems[0].label).toBe("Copy for Slack");
		expect(enItems[1].label).toBe("Copy for Discord");
	});
});
