import { App, setIcon, SuggestModal } from "obsidian";
import { FormatItemConfig, getFormatItems } from "../types";
import { t } from "../i18n";

export class FormatSelectModal extends SuggestModal<FormatItemConfig> {
	private readonly onChoose: (item: FormatItemConfig) => void;

	constructor(app: App, onChoose: (item: FormatItemConfig) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder(t("placeholderSelectFormat"));
	}

	getSuggestions(query: string): FormatItemConfig[] {
		const items = getFormatItems();
		if (!query.trim()) {
			return items;
		}
		const lowerQuery = query.toLowerCase().trim();
		return items.filter(
			(item) =>
				item.label.toLowerCase().includes(lowerQuery) ||
				item.id.toLowerCase().includes(lowerQuery)
		);
	}

	renderSuggestion(item: FormatItemConfig, el: HTMLElement): void {
		el.empty();
		el.addClass("format-convert-modal-item");

		const iconEl = el.createSpan({ cls: "format-convert-modal-icon" });
		setIcon(iconEl, item.icon);

		el.createSpan({ cls: "format-convert-modal-label", text: item.label });
	}

	onChooseSuggestion(item: FormatItemConfig): void {
		this.onChoose(item);
	}
}
