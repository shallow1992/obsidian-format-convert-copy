import { describe, expect, it, vi } from "vitest";
import FormatConvertPlugin from "../src/main";
import { DEFAULT_SETTINGS } from "../src/types";

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
});
