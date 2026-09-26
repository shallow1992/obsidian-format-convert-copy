import { vi } from "vitest";

let currentLocale = "en";
export const moment = {
	locale: (loc?: string) => {
		if (loc) currentLocale = loc;
		return currentLocale;
	},
};

export const Platform = {
	isMobile: false,
	isDesktop: true,
	isMacOS: true,
	isWin: false,
	isLinux: false,
	isIosApp: false,
	isAndroidApp: false,
};

export const noticeInstances: string[] = [];

export class Notice {
	constructor(public message: string, public timeout?: number) {
		noticeInstances.push(message);
	}
}

export class TFile {
	extension: string = "md";
	path: string = "test.md";
}

export class WorkspaceLeaf {
	view: any;
	constructor(view?: any) {
		this.view = view;
	}
}

export class App {
	workspace = {
		getActiveViewOfType: vi.fn(),
		getActiveFile: vi.fn(),
		getLeavesOfType: vi.fn().mockReturnValue([]),
		on: vi.fn(),
	};
	vault = {
		cachedRead: vi.fn().mockResolvedValue("test content"),
	};
}

export class MarkdownView {
	editor: any;
}

export class Plugin {
	app: any;
	manifest: any;
	constructor(app?: any, manifest?: any) {
		this.app = app || new App();
		this.manifest = manifest;
	}
	addCommand() {}
	addRibbonIcon() {
		return { remove: vi.fn() };
	}
	addSettingTab() {}
	registerEvent() {}
	loadData() {
		return Promise.resolve({});
	}
	saveData() {
		return Promise.resolve();
	}
}

export class PluginSettingTab {
	constructor(public app: any, public plugin: any) {}
	display(): void {}
	hide(): void {}
}

export class Setting {
	constructor(public containerEl: any) {}
	setName() { return this; }
	setDesc() { return this; }
	setHeading() { return this; }
	addToggle(cb: (t: any) => any) {
		cb({ setValue: () => ({ onChange: () => {} }) });
		return this;
	}
	addDropdown(cb: (d: any) => any) {
		cb({
			addOption: function () {
				return this;
			},
			setValue: () => ({ onChange: () => {} }),
		});
		return this;
	}
	addButton() { return this; }
}

export class Editor {
	getSelection(): string { return ""; }
	getValue(): string { return ""; }
	getCursor(): { line: number; ch: number } { return { line: 0, ch: 0 }; }
	getLine(_line: number): string { return ""; }
}

export function setIcon(el: any, icon: string): void {
	if (el && typeof el.setAttribute === "function") {
		el.setAttribute("data-icon", icon);
	}
}

export class Modal {
	constructor(public app: any) {}
	open(): void {}
	close(): void {}
}

export abstract class SuggestModal<T> extends Modal {
	inputEl = {
		value: "",
		addEventListener: vi.fn(),
	};
	constructor(app: any) {
		super(app);
	}
	setPlaceholder(_placeholder: string): void {}
	abstract getSuggestions(query: string): T[] | Promise<T[]>;
	abstract renderSuggestion(value: T, el: any): void;
	abstract onChooseSuggestion(item: T, evt: any): void;
}

export class Menu {
	items: any[] = [];
	addItem(cb: (item: any) => any) {
		const item = {
			setTitle: vi.fn().mockReturnThis(),
			setIcon: vi.fn().mockReturnThis(),
			onClick: vi.fn().mockReturnThis(),
			setSubmenu: vi.fn(() => new Menu()),
		};
		this.items.push(item);
		cb(item);
		return this;
	}
	showAtMouseEvent = vi.fn();
	showAtPosition = vi.fn();
}
