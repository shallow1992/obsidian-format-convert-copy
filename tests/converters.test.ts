import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	escapeHtml,
	formatAlignedTable,
	isSafeUrl,
	isTableSeparatorRow,
	resolveWikilinks,
} from "../src/converters/common";
import { convertToDiscord } from "../src/converters/discord";
import { convertToSlack, convertToSlackHtml } from "../src/converters/slack";

describe("common - resolveWikilinks", () => {
	it("resolves basic wikilinks", () => {
		expect(resolveWikilinks("See [[Note 1]]")).toBe("See Note 1");
	});

	it("resolves wikilinks with alias", () => {
		expect(resolveWikilinks("See [[Note 1|My Note]]")).toBe("See My Note");
	});

	it("resolves wikilinks with header anchor", () => {
		expect(resolveWikilinks("See [[Note 1#Heading]]")).toBe("See Note 1");
		expect(resolveWikilinks("See [[Note 1#Heading|Custom]]")).toBe("See Custom");
	});

	it("resolves image and media wikilink embeds", () => {
		expect(resolveWikilinks("![[photo.png]]")).toBe("[image: photo.png]");
		expect(resolveWikilinks("![[photo.png|300]]")).toBe("[image: photo.png]");
		expect(resolveWikilinks("![[photo.png|300x200]]")).toBe("[image: photo.png]");
		expect(resolveWikilinks("![[photo.png|Hero Image]]")).toBe("[image: Hero Image]");
		expect(resolveWikilinks("![[audio.mp3]]")).toBe("[media: audio.mp3]");
		expect(resolveWikilinks("![[document.pdf]]")).toBe("[attachment: document.pdf]");
		expect(resolveWikilinks("![[Sub Note]]")).toBe("[embedded: Sub Note]");
	});

	it("normalizes standard markdown images", () => {
		expect(resolveWikilinks("![Alt](https://example.com/pic.png)")).toBe(
			"[image: Alt](https://example.com/pic.png)"
		);
		expect(resolveWikilinks("![](https://example.com/pic.png)")).toBe(
			"[image](https://example.com/pic.png)"
		);
	});
});

describe("common - table formatting", () => {
	it("detects table separator rows", () => {
		expect(isTableSeparatorRow("| --- | --- |")).toBe(true);
		expect(isTableSeparatorRow("|:---|:---:|---:|")).toBe(true);
		expect(isTableSeparatorRow("--- | ---")).toBe(true);
		expect(isTableSeparatorRow("| not | sep |")).toBe(false);
	});

	it("aligns unaligned markdown tables", () => {
		const unaligned = [
			"| A | Long Header |",
			"|---|---|",
			"| 1 | 2 |",
		];
		const aligned = formatAlignedTable(unaligned);
		expect(aligned).toBe(
			"| A   | Long Header |\n" +
			"|:----|:------------|\n" +
			"| 1   | 2           |"
		);
	});

	it("supports center and right alignments", () => {
		const table = [
			"| Left | Center | Right |",
			"| :--- | :---: | ---: |",
			"| L | C | R |",
		];
		const aligned = formatAlignedTable(table);
		expect(aligned).toContain("|:-----|:------:|------:|");
	});
});

describe("common - security sanitizers", () => {
	it("escapes html characters including quotes", () => {
		expect(escapeHtml(`"hello" & 'world' <tag>`)).toBe(
			"&quot;hello&quot; &amp; &#39;world&#39; &lt;tag&gt;"
		);
	});

	it("validates safe URLs", () => {
		expect(isSafeUrl("https://example.com")).toBe(true);
		expect(isSafeUrl("http://example.com/path?a=1&b=2")).toBe(true);
		expect(isSafeUrl("mailto:test@example.com")).toBe(true);
		expect(isSafeUrl("tel:+1234567890")).toBe(true);
		expect(isSafeUrl("obsidian://open?vault=test")).toBe(true);
		expect(isSafeUrl("#section-anchor")).toBe(true);
	});

	it("rejects unsafe URLs", () => {
		expect(isSafeUrl("javascript:alert(1)")).toBe(false);
		expect(isSafeUrl("  javascript:alert(1)  ")).toBe(false);
		expect(isSafeUrl("JAVASCRIPT:alert(1)")).toBe(false);
		expect(isSafeUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe(false);
		expect(isSafeUrl("vbscript:MsgBox(1)")).toBe(false);
		expect(isSafeUrl("file:///etc/passwd")).toBe(false);
	});
});

describe("slack converter", () => {
	it("converts bold, italic, and strikethrough", () => {
		const md = "**Bold** and *Italic* and ~~Deleted~~";
		expect(convertToSlack(md)).toBe("*Bold* and _Italic_ and ~Deleted~");
	});

	it("converts headings to bold", () => {
		const md = "# Heading 1\n## Heading 2";
		expect(convertToSlack(md)).toBe("*Heading 1*\n*Heading 2*");
	});

	it("converts links to Slack format <url|text> and sanitizes unsafe schemes", () => {
		const md = "[Google](https://google.com)\n[Evil](javascript:alert(1))\n[Mail](mailto:test@example.com)";
		const converted = convertToSlack(md);
		expect(converted).toContain("<https://google.com|Google>");
		expect(converted).toContain("<mailto:test@example.com|Mail>");
		expect(converted).not.toContain("javascript:");
		expect(converted).toContain("Evil");
	});

	it("converts task list checkboxes", () => {
		const md = "- [ ] Todo task\n- [x] Done task";
		const converted = convertToSlack(md);
		expect(converted).toContain("☐ Todo task");
		expect(converted).toContain("☑ Done task");
	});

	it("converts Obsidian callouts", () => {
		const md = "> [!NOTE] This is a note";
		expect(convertToSlack(md)).toBe("> *[This is a note]*");
	});

	it("preserves code blocks without converting inner syntax", () => {
		const md = "```typescript\nconst a = **not bold**;\n```";
		const converted = convertToSlack(md);
		expect(converted).toContain("const a = **not bold**;");
	});

	it("preserves tilde code blocks (~~~ and ~~~~)", () => {
		const md = "~~~python\ndef calc(x, y):\n    return x * y + __secret__\n~~~";
		const converted = convertToSlack(md);
		expect(converted).toContain("return x * y + __secret__");
		const discordConverted = convertToDiscord(md);
		expect(discordConverted).toContain("return x * y + __secret__");
		const waConverted = convertToWhatsApp(md);
		expect(waConverted).toContain("return x * y + __secret__");
		const html = convertToSlackHtml(md);
		expect(html).toContain("return x * y + __secret__");
	});

	it("preserves multi-length backtick blocks (```` ````) with nested backticks", () => {
		const md = "````markdown\nHere is code:\n```js\nconst str = `hello ${name}`;\n```\n````";
		const converted = convertToSlack(md);
		expect(converted).toContain("const str = `hello ${name}`;");
		const discordConverted = convertToDiscord(md);
		expect(discordConverted).toContain("const str = `hello ${name}`;");
		const waConverted = convertToWhatsApp(md);
		expect(waConverted).toContain("const str = `hello ${name}`;");
	});

	it("formats markdown tables into monospace code blocks", () => {
		const md = "| Col1 | Col2 |\n|---|---|\n| Val1 | Val2 |";
		const converted = convertToSlack(md);
		expect(converted).toContain("```\n| Col1");
		expect(converted).toContain("| Val1");
	});

	it("protects LaTeX math blocks and inline formulas in Slack with $$ and $", () => {
		const md = "Formula $x_1 * y_1$ and block:\n$$\nE = mc^2\n$$\nCurrency: $10.00 and $20.00";
		const converted = convertToSlack(md);
		expect(converted).toContain("Formula $x_1 * y_1$ and block:");
		expect(converted).toContain("$$\nE = mc^2\n$$");
		expect(converted).not.toContain("```");
		expect(converted).toContain("Currency: $10.00 and $20.00");
	});

	it("generates valid Slack HTML with link sanitization and table pre/code", () => {
		const md = "- [ ] Task 1\n- [x] Task 2\n\n**Bold Text**\n[Safe](https://example.com)\n[Evil](javascript:alert(1))\n\n| H1 | H2 |\n|---|---|\n| D1 | D2 |\n\nFormula $a_b$";
		const html = convertToSlackHtml(md);
		expect(html).toContain("☐ Task 1");
		expect(html).toContain("☑ <s>Task 2</s>");
		expect(html).toContain("<b>Bold Text</b>");
		expect(html).toContain('<a href="https://example.com">Safe</a>');
		expect(html).not.toContain("javascript:");
		expect(html).toContain("Evil");
		expect(html).toContain("<p>```<br>| H1");
		expect(html).toContain("Formula $a_b$");
		expect(html).not.toContain("<code>$a_b$</code>");
	});

	it("generates plain markdown paragraph structure for code blocks in Slack HTML", () => {
		const md = "```typescript\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}\n```";
		const html = convertToSlackHtml(md);
		expect(html).toBe(
			"<p>```typescript<br>function greet(name: string): string {<br>&nbsp;&nbsp;&nbsp;&nbsp;return `Hello, ${name}!`;<br>}<br>```</p>"
		);
		const plain = convertToSlack(md);
		expect(plain).toBe(
			"```\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}\n```"
		);
	});

	it("preserves empty lines for mobile plain text fallback when requested", () => {
		const md = "Line 1\n\nLine 2\n\n\nLine 3";
		const converted = convertToSlack(md, { preserveMobileEmptyLines: true });
		expect(converted).toBe("Line 1\n\u00A0\nLine 2\n\u00A0\n\u00A0\nLine 3");
	});

	it("converts image embeds in Slack", () => {
		const md = "![[chart.png|300]]\n![Dashboard](https://example.com/dash.png)";
		const converted = convertToSlack(md);
		expect(converted).toContain("[image: chart.png]");
		expect(converted).toContain("<https://example.com/dash.png|image: Dashboard>");
	});
});

describe("discord converter", () => {
	it("converts bold and underline appropriately", () => {
		const md = "__underline__ and **bold** and <u>tag underline</u>";
		expect(convertToDiscord(md)).toBe("**underline** and **bold** and __tag underline__");
	});

	it("converts task list checkboxes with strikethrough", () => {
		const md = "- [ ] Unfinished\n- [x] Finished";
		const converted = convertToDiscord(md);
		expect(converted).toContain("☐ Unfinished");
		expect(converted).toContain("☑ ~~Finished~~");
	});

	it("converts callouts to bold quote", () => {
		const md = "> [!INFO] Important info";
		expect(convertToDiscord(md)).toBe("> **[Important info]**");
	});

	it("formats tables into code blocks and protects code block syntax", () => {
		const md = "| A | B |\n|---|---|\n| 1 | 2 |\n\n```python\ndef __init__(self):\n    pass\n```";
		const converted = convertToDiscord(md);
		expect(converted).toContain("```\n| A");
		expect(converted).toContain("def __init__(self):");
	});

	it("protects LaTeX math in Discord", () => {
		const md = "Formula $x_1 * y_1$ and $$\nE = mc^2\n$$";
		const converted = convertToDiscord(md);
		expect(converted).toContain("`$x_1 * y_1$`");
		expect(converted).toContain("```\n$$\nE = mc^2\n$$\n```");
	});

	it("converts image embeds in Discord", () => {
		const md = "![[chart.png]]\n![Alt](https://example.com/pic.png)";
		const converted = convertToDiscord(md);
		expect(converted).toContain("[image: chart.png]");
		expect(converted).toContain("[image: Alt](https://example.com/pic.png)");
	});
});

import { convertToWhatsApp } from "../src/converters/whatsapp";

describe("whatsapp converter", () => {
	it("converts bold, italic, and strikethrough", () => {
		const md = "**Bold** and *Italic* and ~~Deleted~~";
		expect(convertToWhatsApp(md)).toBe("*Bold* and _Italic_ and ~Deleted~");
	});

	it("converts headings to bold", () => {
		const md = "# Heading 1\n## Heading 2";
		expect(convertToWhatsApp(md)).toBe("*Heading 1*\n*Heading 2*");
	});

	it("converts markdown links to text (url) and sanitizes unsafe links", () => {
		const md = "[Google](https://google.com)\n[Evil](javascript:alert(1))";
		const converted = convertToWhatsApp(md);
		expect(converted).toContain("Google (https://google.com)");
		expect(converted).toContain("Evil");
		expect(converted).not.toContain("javascript:");
	});

	it("formats markdown tables into monospace code blocks", () => {
		const md = "| Col1 | Col2 |\n|---|---|\n| Val1 | Val2 |";
		const converted = convertToWhatsApp(md);
		expect(converted).toContain("```\n| Col1");
		expect(converted).toContain("| Val1");
	});

	it("protects LaTeX math in WhatsApp", () => {
		const md = "Formula $x_1 * y_1$ and $$\nE = mc^2\n$$";
		const converted = convertToWhatsApp(md);
		expect(converted).toContain("`$x_1 * y_1$`");
		expect(converted).toContain("```\n$$\nE = mc^2\n$$\n```");
	});

	it("converts image embeds in WhatsApp", () => {
		const md = "![[chart.png]]\n![Alt](https://example.com/pic.png)";
		const converted = convertToWhatsApp(md);
		expect(converted).toContain("[image: chart.png]");
		expect(converted).toContain("image: Alt (https://example.com/pic.png)");
	});

	it("converts task list checkboxes", () => {
		const md = "- [ ] Todo task\n- [x] Done task";
		const converted = convertToWhatsApp(md);
		expect(converted).toContain("☐ Todo task");
		expect(converted).toContain("☑ Done task");
	});

	it("converts callouts to bold quote", () => {
		const md = "> [!NOTE] This is a note";
		expect(convertToWhatsApp(md)).toBe("> *[This is a note]*");
	});
});

import { convertMarkdown } from "../src/converters";

describe("convertMarkdown dispatcher", () => {
	const sample = "# Hello\n- [ ] Task";

	it("dispatches slack format with native slack/texty custom MIME types", () => {
		const res = convertMarkdown(sample, "slack");
		expect(res.label).toBe("Slack");
		expect(res.text).toContain("*Hello*");
		expect(res.customMimeTypes?.["slack/texty"]).toBeDefined();
		expect(res.customMimeTypes?.["text/markdown"]).toBeDefined();
	});

	it("dispatches discord format", () => {
		const res = convertMarkdown(sample, "discord");
		expect(res.label).toBe("Discord");
		expect(res.text).toContain("☐ Task");
	});

	it("dispatches whatsapp format", () => {
		const res = convertMarkdown(sample, "whatsapp");
		expect(res.label).toBe("WhatsApp");
		expect(res.text).toContain("*Hello*");
	});

	it("dispatches raw format", () => {
		const res = convertMarkdown(sample, "raw");
		expect(res.label).toBe("Markdown");
		expect(res.text).toBe(sample);
	});
});

import { FORMAT_ITEMS } from "../src/types";

describe("FORMAT_ITEMS mobile toolbar icons", () => {
	it("has distinct, valid icons for each format item", () => {
		const icons = FORMAT_ITEMS.map((item) => item.icon);
		const uniqueIcons = new Set(icons);
		expect(uniqueIcons.size).toBe(FORMAT_ITEMS.length);
		for (const item of FORMAT_ITEMS) {
			expect(item.icon).toBeTruthy();
		}
	});
});

import { getTargetText } from "../src/main";

describe("getTargetText selection behavior", () => {
	it("returns selected text when selection is non-empty regardless of setting", () => {
		const mockEditor = {
			getSelection: () => "Selected snippet",
			getValue: () => "Full document content",
			getCursor: () => ({ line: 1, ch: 0 }),
			getLine: () => "Line 2 content",
		} as any;

		expect(getTargetText(mockEditor, "document")).toBe("Selected snippet");
		expect(getTargetText(mockEditor, "currentLine")).toBe("Selected snippet");
	});

	it("returns full document when selection is empty and behavior is document", () => {
		const mockEditor = {
			getSelection: () => "   ",
			getValue: () => "Full document content",
			getCursor: () => ({ line: 1, ch: 0 }),
			getLine: () => "Line 2 content",
		} as any;

		expect(getTargetText(mockEditor, "document")).toBe("Full document content");
	});

	it("returns current cursor line when selection is empty and behavior is currentLine", () => {
		const mockEditor = {
			getSelection: () => "",
			getValue: () => "Line 1\nLine 2 content\nLine 3",
			getCursor: () => ({ line: 1, ch: 0 }),
			getLine: (line: number) => (line === 1 ? "Line 2 content" : ""),
		} as any;

		expect(getTargetText(mockEditor, "currentLine")).toBe("Line 2 content");
	});

	it("returns empty string when editor is null or undefined", () => {
		expect(getTargetText(null)).toBe("");
		expect(getTargetText(undefined)).toBe("");
	});
});

import { copyToClipboard } from "../src/utils/clipboard";
import { noticeInstances } from "./__mocks__/obsidian";

describe("copyToClipboard rich text and silent mode", () => {
	beforeEach(() => {
		noticeInstances.length = 0;
		(globalThis as any).ClipboardItem = class ClipboardItem {
			constructor(public data: Record<string, Blob>) {}
		};
		Object.defineProperty(globalThis, "navigator", {
			value: {
				clipboard: {
					writeText: vi.fn().mockResolvedValue(undefined),
					write: vi.fn().mockResolvedValue(undefined),
				},
			},
			configurable: true,
			writable: true,
		});
	});

	it("shows Notice when silent is false (default)", async () => {
		const success = await copyToClipboard("test text", "Slack", undefined, false);
		expect(success).toBe(true);
		expect(noticeInstances.length).toBeGreaterThan(0);
		expect(noticeInstances[0]).toContain("Slack");
	});

	it("suppresses Notice when silent is true", async () => {
		const success = await copyToClipboard("test text", "Slack", undefined, true);
		expect(success).toBe(true);
		expect(noticeInstances.length).toBe(0);
	});

	it("writes rich HTML via ClipboardItem when html is provided", async () => {
		const success = await copyToClipboard("*test*", "Slack", "<b>test</b>", false);
		expect(success).toBe(true);
		expect(navigator.clipboard.write).toHaveBeenCalled();
	});
});
