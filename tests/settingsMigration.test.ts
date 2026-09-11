import { describe, expect, it, vi } from "vitest";
import FormatConvertPlugin from "../src/main";
import { DEFAULT_SETTINGS } from "../src/types";

describe("Settings migration (silentMode -> showNotification)", () => {
	it("migrates silentMode: true to showNotification: false", async () => {
		const plugin = new FormatConvertPlugin({} as any, {} as any);
		vi.spyOn(plugin, "loadData").mockResolvedValue({
			silentMode: true,
		});

		await plugin.loadSettings();

		expect(plugin.settings.showNotification).toBe(false);
		expect((plugin.settings as any).silentMode).toBeUndefined();
	});

	it("migrates silentMode: false to showNotification: true", async () => {
		const plugin = new FormatConvertPlugin({} as any, {} as any);
		vi.spyOn(plugin, "loadData").mockResolvedValue({
			silentMode: false,
		});

		await plugin.loadSettings();

		expect(plugin.settings.showNotification).toBe(true);
		expect((plugin.settings as any).silentMode).toBeUndefined();
	});

	it("preserves explicit showNotification if already set even if silentMode is present", async () => {
		const plugin = new FormatConvertPlugin({} as any, {} as any);
		vi.spyOn(plugin, "loadData").mockResolvedValue({
			showNotification: true,
			silentMode: true,
		});

		await plugin.loadSettings();

		expect(plugin.settings.showNotification).toBe(true);
	});

	it("uses default showNotification (true) when no previous data exists", async () => {
		const plugin = new FormatConvertPlugin({} as any, {} as any);
		vi.spyOn(plugin, "loadData").mockResolvedValue(null);

		await plugin.loadSettings();

		expect(plugin.settings.showNotification).toBe(true);
		expect(plugin.settings.showNotification).toBe(DEFAULT_SETTINGS.showNotification);
	});
});
