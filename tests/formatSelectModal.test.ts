import { describe, expect, it, vi } from "vitest";
import { FormatSelectModal } from "../src/ui/formatSelectModal";
import { FormatItemConfig } from "../src/types";

describe("FormatSelectModal", () => {
	it("returns all suggestions when query is empty", () => {
		const modal = new FormatSelectModal({} as any, vi.fn());
		const suggestions = modal.getSuggestions("");
		expect(suggestions).toHaveLength(4);
	});

	it("filters suggestions by query case-insensitively", () => {
		const modal = new FormatSelectModal({} as any, vi.fn());
		const slackResults = modal.getSuggestions("slack");
		expect(slackResults).toHaveLength(1);
		expect(slackResults[0].id).toBe("slack");

		const discordResults = modal.getSuggestions("DISCORD");
		expect(discordResults).toHaveLength(1);
		expect(discordResults[0].id).toBe("discord");
	});

	it("filters suggestions by format id as fallback", () => {
		const modal = new FormatSelectModal({} as any, vi.fn());
		const rawResults = modal.getSuggestions("raw");
		expect(rawResults).toHaveLength(1);
		expect(rawResults[0].id).toBe("raw");
	});

	it("calls onChoose callback when suggestion is chosen", () => {
		const onChooseSpy = vi.fn();
		const modal = new FormatSelectModal({} as any, onChooseSpy);
		const targetItem: FormatItemConfig = {
			id: "slack",
			label: "Slack",
			icon: "share-2",
		};

		modal.onChooseSuggestion(targetItem);
		expect(onChooseSpy).toHaveBeenCalledWith(targetItem);
	});

	it("renders suggestion item with icon and label elements", () => {
		const modal = new FormatSelectModal({} as any, vi.fn());
		const createdElements: any[] = [];
		const el = {
			empty: vi.fn(),
			addClass: vi.fn(),
			createSpan: vi.fn((opts) => {
				createdElements.push(opts);
				return { setAttribute: vi.fn() };
			}),
		};

		const item: FormatItemConfig = {
			id: "slack",
			label: "Slack形式でコピー",
			icon: "share-2",
		};

		modal.renderSuggestion(item, el as any);

		expect(el.empty).toHaveBeenCalled();
		expect(el.addClass).toHaveBeenCalledWith("format-convert-modal-item");
		expect(createdElements).toEqual([
			{ cls: "format-convert-modal-icon" },
			{ cls: "format-convert-modal-label", text: "Slack形式でコピー" },
		]);
	});
});
