import { vi } from "vitest";

export const Platform = {
	isMobile: false,
	isDesktop: true,
	isMacOS: true,
	isWin: false,
	isLinux: false,
	isIosApp: false,
	isAndroidApp: false,
};

export class Notice {
	constructor(public message: string, public timeout?: number) {}
}

export class App {
	workspace = {
		getActiveViewOfType: vi.fn(),
		on: vi.fn(),
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
	addRibbonIcon() {}
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
	addToggle(cb: (t: any) => any) {
		cb({ setValue: () => ({ onChange: () => {} }) });
		return this;
	}
	addButton() { return this; }
}

export class Editor {
	getSelection(): string { return ""; }
	getValue(): string { return ""; }
}

export class Menu {
	addItem(cb: (item: any) => any) {
		cb({
			setTitle: () => ({ setIcon: () => ({ onClick: () => {} }) }),
		});
		return this;
	}
	showAtMouseEvent(_evt: any) {}
}
