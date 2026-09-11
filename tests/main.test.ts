import { describe, expect, it, vi } from "vitest";
import FormatConvertPlugin from "../src/main";
import { DEFAULT_SETTINGS, FORMAT_DEFINITIONS, type FormatType } from "../src/types";

describe("FormatConvertPlugin core methods (#109)", () => {
	it("convertAndCopy converts markdown and delegates to copyResult", async () => {
		const plugin = new FormatConvertPlugin({} as any, {} as any);
		plugin.settings = { ...DEFAULT_SETTINGS };

		const copySpy = vi.spyOn(plugin, "copyResult").mockResolvedValue(true);

		const success = await plugin.convertAndCopy("**Bold**", "slack");

		expect(success).toBe(true);
		expect(copySpy).toHaveBeenCalledWith(
			"*Bold*",
			"Slack",
			undefined,
			expect.any(Object)
		);
	});

	it.each<FormatType>(["slack", "discord", "whatsapp", "raw"])(
		"convertAndCopy successfully delegates for format %s",
		async (format) => {
			const plugin = new FormatConvertPlugin({} as any, {} as any);
			plugin.settings = { ...DEFAULT_SETTINGS };

			const copySpy = vi.spyOn(plugin, "copyResult").mockResolvedValue(true);
			const success = await plugin.convertAndCopy("sample text", format);

			expect(success).toBe(true);
			expect(copySpy).toHaveBeenCalled();
		}
	);
});

describe("FORMAT_DEFINITIONS registry metadata (#109)", () => {
	it("contains exactly 4 format definitions", () => {
		expect(FORMAT_DEFINITIONS).toHaveLength(4);
	});

	it("has unique IDs and command IDs for backward compatibility", () => {
		const ids = FORMAT_DEFINITIONS.map((def) => def.id);
		const commandIds = FORMAT_DEFINITIONS.map((def) => def.commandId);

		expect(new Set(ids).size).toBe(4);
		expect(new Set(commandIds).size).toBe(4);

		// Backward compatibility check for historical command IDs
		expect(commandIds).toContain("convert-slack");
		expect(commandIds).toContain("convert-discord");
		expect(commandIds).toContain("convert-whatsapp");
		expect(commandIds).toContain("copy-raw-markdown");
	});

	it("all settings keys correspond to keys in DEFAULT_SETTINGS", () => {
		for (const def of FORMAT_DEFINITIONS) {
			expect(def.settings.ribbon in DEFAULT_SETTINGS).toBe(true);
			expect(def.settings.file in DEFAULT_SETTINGS).toBe(true);
			expect(def.settings.editor in DEFAULT_SETTINGS).toBe(true);
			expect(def.icon).toBeTruthy();
			expect(def.actionKey).toBeTruthy();
			expect(def.cmdKey).toBeTruthy();
		}
	});
});
