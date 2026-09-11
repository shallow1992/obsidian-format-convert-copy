import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../src/types";

describe("DEFAULT_SETTINGS optimization (#106)", () => {
	it("has only ribbon format menu icon enabled by default and all direct icons disabled", () => {
		expect(DEFAULT_SETTINGS.showRibbonMenuIcon).toBe(true);
		expect(DEFAULT_SETTINGS.showRibbonSlackIcon).toBe(false);
		expect(DEFAULT_SETTINGS.showRibbonDiscordIcon).toBe(false);
		expect(DEFAULT_SETTINGS.showRibbonWhatsAppIcon).toBe(false);
		expect(DEFAULT_SETTINGS.showRibbonRawIcon).toBe(false);
	});

	it("defaults emptySelectionBehavior to document", () => {
		expect(DEFAULT_SETTINGS.emptySelectionBehavior).toBe("document");
	});

	it("defaults showNotification to true (#105, #106)", () => {
		expect(DEFAULT_SETTINGS.showNotification).toBe(true);
	});

	it("has only file explorer format menu enabled and direct file items disabled", () => {
		expect(DEFAULT_SETTINGS.showFileMenuItem).toBe(true);
		expect(DEFAULT_SETTINGS.showFileSlackItem).toBe(false);
		expect(DEFAULT_SETTINGS.showFileDiscordItem).toBe(false);
		expect(DEFAULT_SETTINGS.showFileWhatsAppItem).toBe(false);
		expect(DEFAULT_SETTINGS.showFileRawItem).toBe(false);
	});

	it("has all desktop editor context menu items disabled by default", () => {
		expect(DEFAULT_SETTINGS.showSlackInMenu).toBe(false);
		expect(DEFAULT_SETTINGS.showDiscordInMenu).toBe(false);
		expect(DEFAULT_SETTINGS.showWhatsAppInMenu).toBe(false);
		expect(DEFAULT_SETTINGS.showRawInMenu).toBe(false);
	});
});
