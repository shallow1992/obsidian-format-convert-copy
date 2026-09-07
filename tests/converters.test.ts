import { describe, expect, it } from "vitest";
import { resolveWikilinks } from "../src/converters/common";
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

describe("slack converter", () => {
	it("converts bold, italic, and strikethrough", () => {
		const md = "**Bold** and *Italic* and ~~Deleted~~";
		expect(convertToSlack(md)).toBe("*Bold* and _Italic_ and ~Deleted~");
	});

	it("converts headings to bold", () => {
		const md = "# Heading 1\n## Heading 2";
		expect(convertToSlack(md)).toBe("*Heading 1*\n*Heading 2*");
	});

	it("converts links to Slack format <url|text>", () => {
		const md = "[Google](https://google.com)";
		expect(convertToSlack(md)).toBe("<https://google.com|Google>");
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

	it("generates valid Slack HTML", () => {
		const md = "- [ ] Task 1\n- [x] Task 2\n\n**Bold Text**";
		const html = convertToSlackHtml(md);
		expect(html).toContain("☐ Task 1");
		expect(html).toContain("☑ <s>Task 2</s>");
		expect(html).toContain("<b>Bold Text</b>");
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
