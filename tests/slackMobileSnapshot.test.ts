import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { convertToSlackMobileHtml } from "../src/converters/slackMobile";

describe("Slack Mobile HTML Snapshot Testing", () => {
	it("converts tests/manual/slack-ios-poc-phase1.md and matches snapshot", () => {
		const suitePath = path.resolve(__dirname, "manual/slack-ios-poc-phase1.md");
		const content = fs.readFileSync(suitePath, "utf-8");

		const html = convertToSlackMobileHtml(content);

		// Sanity checks on Phase 1 features
		expect(html).toContain("<b>This text should be bold</b>");
		expect(html).toContain("<b>This text should also be bold</b>");
		expect(html).toContain("<i>This text should be italic</i>");
		expect(html).toContain("<s>This text should have a line through it</s>");
		expect(html).toContain("<u>This text should be underlined</u>");
		expect(html).toContain("<code>const message = &quot;Hello from iOS&quot;;</code>");
		expect(html).toContain('<a href="https://www.google.com">Google Search</a>');
		expect(html).toContain("<b><i>Bold and Italic combined</i></b>");
		expect(html).toContain("<s><b>Bold Strikethrough</b></s>");
		expect(html).toContain("<u><b>Underlined Bold</b></u>");

		// Snapshot assertion to detect unintended HTML regressions
		expect(html).toMatchSnapshot();
	});

	it("converts tests/manual/slack-ios-poc-phase2.md and matches snapshot", () => {
		const suitePath = path.resolve(__dirname, "manual/slack-ios-poc-phase2.md");
		const content = fs.readFileSync(suitePath, "utf-8");

		const html = convertToSlackMobileHtml(content);

		// Sanity checks on Phase 2 features
		expect(html).toContain("<ul><li>Level 1 Bullet Item A");
		expect(html).toContain("<ol><li>Step 1 (Root Level)");
		expect(html).toContain("<blockquote>&gt; This is a standard single-line blockquote.</blockquote>");
		expect(html).toContain("<blockquote>&gt; <b>[Release Update]</b><br>&gt; This is an Obsidian callout block.");
		expect(html).toContain("☐ Incomplete task item");
		expect(html).toContain("☑ <s>Completed task item (should have strikethrough)</s>");

		expect(html).toMatchSnapshot();
	});

	it("converts tests/manual/slack-ios-poc-phase3.md and matches snapshot", () => {
		const suitePath = path.resolve(__dirname, "manual/slack-ios-poc-phase3.md");
		const content = fs.readFileSync(suitePath, "utf-8");

		const html = convertToSlackMobileHtml(content);

		expect(html).toContain("<p>```typescript<br>console.log(&quot;Hello, Slack iOS!&quot;);<br>```</p>");
		expect(html).toContain("<p>```javascript<br>function calculateTotal(items) {");
		expect(html).toContain("&lt;div class=&quot;container&quot;&gt;");

		expect(html).toMatchSnapshot();
	});

	it("converts tests/manual/slack-ios-poc-phase4.md and matches snapshot", () => {
		const suitePath = path.resolve(__dirname, "manual/slack-ios-poc-phase4.md");
		const content = fs.readFileSync(suitePath, "utf-8");

		const html = convertToSlackMobileHtml(content);

		// Tables are formatted inside ``` code blocks with aligned monospace columns
		expect(html).toContain("<p>```<br>| Item   | Status");
		expect(html).toContain("| 項目名       | 進捗");

		// Math formulas
		expect(html).toContain("<code>$E = mc^2$</code>");
		expect(html).toContain("<p>```<br>$$<br>");

		expect(html).toMatchSnapshot();
	});
});
