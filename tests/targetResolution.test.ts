import { beforeEach, describe, expect, it, vi } from "vitest";
import FormatConvertPlugin, { getVisibleMarkdownLeaves } from "../src/main";
import { DEFAULT_SETTINGS } from "../src/types";
import { noticeInstances } from "./__mocks__/obsidian";

describe("targetResolution pipeline (#112)", () => {
	beforeEach(() => {
		noticeInstances.length = 0;
	});

	it("getVisibleMarkdownLeaves filters out hidden leaves whose container offsetParent is null", () => {
		const visibleLeaf = {
			view: {
				containerEl: { offsetParent: {} },
			},
		};
		const hiddenLeaf = {
			view: {
				containerEl: { offsetParent: null },
			},
		};
		const leafWithoutEl = {
			view: {},
		};

		const mockApp = {
			workspace: {
				getLeavesOfType: vi.fn().mockReturnValue([visibleLeaf, hiddenLeaf, leafWithoutEl]),
			},
		};

		const result = getVisibleMarkdownLeaves(mockApp as any);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe(visibleLeaf);
	});

	it("returns selected text immediately when an active editor has selection", async () => {
		const mockPlugin = new FormatConvertPlugin({} as any, {} as any);
		mockPlugin.settings = { ...DEFAULT_SETTINGS };

		const mockEditor = {
			getSelection: vi.fn().mockReturnValue("Selected Text"),
			getValue: vi.fn().mockReturnValue("Full note content"),
		};

		mockPlugin.app = {
			workspace: {
				getActiveViewOfType: vi.fn().mockReturnValue({ editor: mockEditor }),
				getLeavesOfType: vi.fn().mockReturnValue([]),
			},
		} as any;

		const target = await mockPlugin.resolveTargetText();
		expect(target).toBe("Selected Text");
		expect(noticeInstances).toHaveLength(0);
	});

	it("returns selected text from visible leaf even if getActiveViewOfType returns null", async () => {
		const mockPlugin = new FormatConvertPlugin({} as any, {} as any);
		mockPlugin.settings = { ...DEFAULT_SETTINGS };

		const mockEditor = {
			getSelection: vi.fn().mockReturnValue("Background Selection"),
			getValue: vi.fn().mockReturnValue("Full note content"),
		};

		// Leaf has view with editor and offsetParent
		const leaf = {
			view: {
				editor: mockEditor,
				containerEl: { offsetParent: {} },
			},
		};
		// make view an instance of MarkdownView
		Object.setPrototypeOf(leaf.view, (await import("obsidian")).MarkdownView.prototype);

		mockPlugin.app = {
			workspace: {
				getActiveViewOfType: vi.fn().mockReturnValue(null),
				getLeavesOfType: vi.fn().mockReturnValue([leaf]),
			},
		} as any;

		const target = await mockPlugin.resolveTargetText();
		expect(target).toBe("Background Selection");
		expect(noticeInstances).toHaveLength(0);
	});

	it("shows noticeSplitAmbiguous and returns null when split view has multiple visible leaves without selection", async () => {
		const mockPlugin = new FormatConvertPlugin({} as any, {} as any);
		mockPlugin.settings = { ...DEFAULT_SETTINGS };

		const createLeaf = () => {
			const view = {
				editor: {
					getSelection: vi.fn().mockReturnValue(""),
					getValue: vi.fn().mockReturnValue("Content"),
				},
				containerEl: { offsetParent: {} },
			};
			return { view };
		};

		const leaf1 = createLeaf();
		const leaf2 = createLeaf();
		const MarkdownViewClass = (await import("obsidian")).MarkdownView;
		Object.setPrototypeOf(leaf1.view, MarkdownViewClass.prototype);
		Object.setPrototypeOf(leaf2.view, MarkdownViewClass.prototype);

		mockPlugin.app = {
			workspace: {
				getActiveViewOfType: vi.fn().mockReturnValue(null),
				getLeavesOfType: vi.fn().mockReturnValue([leaf1, leaf2]),
			},
		} as any;

		const target = await mockPlugin.resolveTargetText();
		expect(target).toBeNull();
		expect(noticeInstances).toContain("Multiple notes are open in split view. Please select text or focus on a note.");
	});

	it("returns active editor content in split view when cursor is placed without selection", async () => {
		const mockPlugin = new FormatConvertPlugin({} as any, {} as any);
		mockPlugin.settings = { ...DEFAULT_SETTINGS, emptySelectionBehavior: "document" };

		const mockEditor = {
			getSelection: vi.fn().mockReturnValue(""),
			getValue: vi.fn().mockReturnValue("Active split pane document"),
		};

		const leaf1 = {
			view: {
				editor: mockEditor,
				containerEl: { offsetParent: {} },
			},
		};
		const leaf2 = {
			view: {
				editor: {
					getSelection: vi.fn().mockReturnValue(""),
					getValue: vi.fn().mockReturnValue("Other split pane document"),
				},
				containerEl: { offsetParent: {} },
			},
		};
		const MarkdownViewClass = (await import("obsidian")).MarkdownView;
		Object.setPrototypeOf(leaf1.view, MarkdownViewClass.prototype);
		Object.setPrototypeOf(leaf2.view, MarkdownViewClass.prototype);

		// Active editor is leaf1
		mockPlugin.app = {
			workspace: {
				getActiveViewOfType: vi.fn().mockReturnValue(leaf1.view),
				getLeavesOfType: vi.fn().mockReturnValue([leaf1, leaf2]),
			},
		} as any;

		const target = await mockPlugin.resolveTargetText();
		expect(target).toBe("Active split pane document");
		expect(noticeInstances).toHaveLength(0);
	});

	it("returns entire note when single visible leaf exists without selection", async () => {
		const mockPlugin = new FormatConvertPlugin({} as any, {} as any);
		mockPlugin.settings = { ...DEFAULT_SETTINGS, emptySelectionBehavior: "document" };

		const mockEditor = {
			getSelection: vi.fn().mockReturnValue(""),
			getValue: vi.fn().mockReturnValue("Full document content"),
		};

		const leaf = {
			view: {
				editor: mockEditor,
				containerEl: { offsetParent: {} },
			},
		};
		const MarkdownViewClass = (await import("obsidian")).MarkdownView;
		Object.setPrototypeOf(leaf.view, MarkdownViewClass.prototype);

		mockPlugin.app = {
			workspace: {
				getActiveViewOfType: vi.fn().mockReturnValue(null),
				getLeavesOfType: vi.fn().mockReturnValue([leaf]),
			},
		} as any;

		const target = await mockPlugin.resolveTargetText();
		expect(target).toBe("Full document content");
		expect(noticeInstances).toHaveLength(0);
	});

	it("shows noticeNoActiveNote when no visible leaves exist", async () => {
		const mockPlugin = new FormatConvertPlugin({} as any, {} as any);
		mockPlugin.settings = { ...DEFAULT_SETTINGS };

		mockPlugin.app = {
			workspace: {
				getActiveViewOfType: vi.fn().mockReturnValue(null),
				getLeavesOfType: vi.fn().mockReturnValue([]),
				getActiveFile: vi.fn().mockReturnValue(null),
			},
		} as any;

		const target = await mockPlugin.resolveTargetText();
		expect(target).toBeNull();
		expect(noticeInstances).toContain("No active note to copy");
	});
});
