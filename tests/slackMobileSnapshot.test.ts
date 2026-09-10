import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { convertToSlackMobileHtml } from "../src/converters/slackMobile";

describe("Slack Mobile HTML Snapshot Testing", () => {
	it("converts tests/manual/slack-comprehensive-test.md and matches snapshot", () => {
		const suitePath = path.resolve(__dirname, "manual/slack-comprehensive-test.md");
		const content = fs.readFileSync(suitePath, "utf-8");

		const html = convertToSlackMobileHtml(content);

		// Headings
		expect(html).toContain("<p><b>Heading 1 (H1: Largest Header)</b></p>");
		expect(html).toContain("<p><b>Heading 2 (H2)</b></p>");

		// Inline formatting
		expect(html).toContain("<b>Bold Text</b>");
		expect(html).toContain("<i>Italic Text</i>");
		expect(html).toContain("<u>Underlined Text</u>");
		expect(html).toContain("<s>Deprecated Information</s>");
		expect(html).toContain("<code>const token = &quot;slack_test_123&quot;;</code>");
		expect(html).toContain('<a href="https://www.google.com">Google Search</a>');
		expect(html).toContain("<b><i>Bold Italic</i></b>");
		expect(html).toContain("<s><b>Bold Strikethrough</b></s>");

		// Lists & Tasks
		expect(html).toContain("<ul><li>Level 1 Bullet Item A");
		expect(html).toContain("<ol><li>Step 1 (Level 1: rendered as <code>1.</code>)");
		expect(html).toContain("☐ Incomplete Task (Level 1)");
		expect(html).toContain("☑ <s>Completed Task (Level 2)</s>");

		// Blockquotes & Callouts
		expect(html).toContain("<p>&gt; This is a standard single-line blockquote.</p>");
		expect(html).toContain("<p>&gt; <b>[Release Announcement]</b><br>&gt; This is an Obsidian callout block.");

		// Code Blocks
		expect(html).toContain("<p>```typescript<br>function calculateTotal(items: { price: number; count: number }[]): number {");
		expect(html).toContain("<p>```<br>Plain code block without language tag.");

		// Tables (aligned monospace code blocks including CJK full-width columns)
		expect(html).toContain("<p>```<br>| Item Name (Left) | Status (Center) | Quantity (Right) | Price (Right) | Notes (Left)");
		expect(html).toContain("| 項目名     | 進捗状況 | 優先度 |");

		// Math
		expect(html).toContain("<code>$E = mc^2$</code>");
		expect(html).toContain("<p>```<br>$$<br>\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}<br>$$<br>```</p>");

		// Wikilinks
		expect(html).toContain("System Architecture");

		// Snapshot assertion
		expect(html).toMatchSnapshot();
	});

	it("converts tests/manual/slack-edge-cases.md and matches snapshot", () => {
		const suitePath = path.resolve(__dirname, "manual/slack-edge-cases.md");
		const content = fs.readFileSync(suitePath, "utf-8");

		const html = convertToSlackMobileHtml(content);

		// Assertions on edge cases:
		// 1. Consecutive empty lines produce <p>&nbsp;</p>
		expect(html).toContain("<p>&nbsp;</p>");

		// 2. Headings containing $$ don't swallow prose
		expect(html).toContain("<p><b>Section 2.1: Verifying $$ and $ Delimiters in Prose</b></p>");
		expect(html).toContain("Here is the formula below that must NOT be accidentally merged with the header:");

		// 3. LaTeX subscripts don't become italicized
		expect(html).toContain("$x_1 * y_1 + x_2 * y_2 \\le z_{max} * \\lambda_{target}$");

		// 4. URLs with balanced parentheses
		expect(html).toContain('href="https://en.wikipedia.org/wiki/Closure_(computer_programming)"');

		// 5. Blockquote separation
		expect(html).toContain("<p>&gt; Quote Block A: First independent quotation.<br>&gt; Line 2 of Quote Block A.</p>");
		expect(html).toContain("<p>&gt; Quote Block B: Second quotation separated by an empty line above.</p>");

		// 6. Horizontal divider
		expect(html).toContain("<p>───</p>");

		expect(html).toMatchSnapshot();
	});
});
