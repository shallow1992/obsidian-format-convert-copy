import { describe, expect, it } from "vitest";
import { escapeHtml, isSafeUrl, resolveWikilinks } from "../src/converters/common";
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

	it("generates valid Slack HTML with link sanitization", () => {
		const md = "- [ ] Task 1\n- [x] Task 2\n\n**Bold Text**\n[Safe](https://example.com)\n[Evil](javascript:alert(1))";
		const html = convertToSlackHtml(md);
		expect(html).toContain("☐ Task 1");
		expect(html).toContain("☑ <s>Task 2</s>");
		expect(html).toContain("<b>Bold Text</b>");
		expect(html).toContain('<a href="https://example.com">Safe</a>');
		expect(html).not.toContain("javascript:");
		expect(html).toContain("Evil");
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

	it("dispatches slack format", () => {
		const res = convertMarkdown(sample, "slack");
		expect(res.label).toBe("Slack");
		expect(res.text).toContain("*Hello*");
		expect(res.html).toBeDefined();
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
