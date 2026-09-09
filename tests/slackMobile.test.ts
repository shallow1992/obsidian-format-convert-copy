import { describe, expect, it } from "vitest";
import { convertMarkdown, convertToSlackMobileHtml } from "../src/converters";
import { formatInlineSlackMobileHtml } from "../src/converters/slackMobile";

describe("Slack Mobile HTML Converter (iOS / Android)", () => {
	describe("Inline Formatting (Phase 1)", () => {
		it("converts bold with asterisks and underscores", () => {
			expect(formatInlineSlackMobileHtml("**bold asterisk**")).toBe("<b>bold asterisk</b>");
			expect(formatInlineSlackMobileHtml("__bold underscore__")).toBe("<b>bold underscore</b>");
		});

		it("converts italic with asterisks and underscores", () => {
			expect(formatInlineSlackMobileHtml("*italic asterisk*")).toBe("<i>italic asterisk</i>");
			expect(formatInlineSlackMobileHtml("_italic underscore_")).toBe("<i>italic underscore</i>");
		});

		it("converts strikethrough", () => {
			expect(formatInlineSlackMobileHtml("~~strikethrough~~")).toBe("<s>strikethrough</s>");
		});

		it("converts underline tags and formats inner markdown", () => {
			expect(formatInlineSlackMobileHtml("<u>underlined text</u>")).toBe("<u>underlined text</u>");
			expect(formatInlineSlackMobileHtml("<u>**underlined bold**</u>")).toBe("<u><b>underlined bold</b></u>");
		});

		it("converts inline code and protects special characters", () => {
			expect(formatInlineSlackMobileHtml("`const x = 1 < 2;`")).toBe("<code>const x = 1 &lt; 2;</code>");
			expect(formatInlineSlackMobileHtml("`*not italic*`")).toBe("<code>*not italic*</code>");
		});

		it("converts hyperlinks with safe URLs", () => {
			expect(formatInlineSlackMobileHtml("[Google](https://google.com)")).toBe(
				'<a href="https://google.com">Google</a>'
			);
			// Blocks dangerous URLs like javascript:
			expect(formatInlineSlackMobileHtml("[Dangerous](javascript:alert(1))")).toBe("Dangerous");
		});

		it("handles combined formatting", () => {
			expect(formatInlineSlackMobileHtml("**Bold `code` text**")).toBe(
				"<b>Bold <code>code</code> text</b>"
			);
			expect(formatInlineSlackMobileHtml("***Bold and Italic***")).toBe(
				"<b><i>Bold and Italic</i></b>"
			);
			expect(formatInlineSlackMobileHtml("~~**Bold Strikethrough**~~")).toBe(
				"<s><b>Bold Strikethrough</b></s>"
			);
		});
	});

	describe("Document Conversion (convertToSlackMobileHtml)", () => {
		it("converts Phase 1 sample note properly", () => {
			const md = [
				"# Heading",
				"**Bold** and *Italic*.",
				"Line 1",
				"Line 2",
				"",
				"New paragraph",
			].join("\n");

			const html = convertToSlackMobileHtml(md);
			expect(html).toContain("<p><b>Heading</b></p>");
			expect(html).toContain("<b>Bold</b> and <i>Italic</i>.");
			expect(html).toContain("Line 1<br>Line 2");
			expect(html).toContain("<p><br></p><p>New paragraph</p>");
		});

		it("converts blockquotes and callouts to <p> paragraphs with &gt; prefix", () => {
			const md = [
				"> Single quote line",
				"",
				"> Line 1",
				"> Line 2",
				"",
				"> [!NOTE]",
				"> Callout body",
			].join("\n");

			const html = convertToSlackMobileHtml(md);
			expect(html).toContain("<p>&gt; Single quote line</p>");
			expect(html).toContain("<p>&gt; Line 1<br>&gt; Line 2</p>");
			expect(html).toContain("<p>&gt; <b>[NOTE]</b><br>&gt; Callout body</p>");
		});

		it("converts code blocks to backtick paragraphs with preserved indentation", () => {
			const md = [
				"```typescript",
				"function test() {",
				"    return 42;",
				"}",
				"```",
			].join("\n");

			const html = convertToSlackMobileHtml(md);
			expect(html).toContain("<p>```typescript<br>function test() {<br>&nbsp;&nbsp;&nbsp;&nbsp;return 42;<br>}<br>```</p>");
		});

		it("does not let prose containing $$ interfere with block math or heading formatting", () => {
			const md = [
				"## 2. 数式表現 (v0.3.25: ネイティブ $$ / $ 検証)",
				"",
				"### インライン数式",
				"- 基本の数式: 文中の $E = mc^2$ が自然に表示されるか。",
				"- 添字記号: $x_1 * y_1 + a_n$",
				"",
				"### ブロック数式",
				"単行のブロック数式:",
				"$$",
				"E = \\sqrt{(mc^2)^2 + (pc)^2}",
				"$$",
				"",
				"複数行の複雑な数式（バッククォート ``` が付かず、$$ だけで囲まれているか確認）:",
				"$$",
				"\\sum_{i=1}^{n} x_i * y_i = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi",
				"$$",
			].join("\n");

			const html = convertToSlackMobileHtml(md);

			// 1. Heading remains intact as a single bold tag, not broken by $$
			expect(html).toContain("<b>2. 数式表現 (v0.3.25: ネイティブ $$ / $ 検証)</b>");

			// 2. Inline formulas are cleanly preserved without <code> tags
			expect(html).toContain("$E = mc^2$");
			expect(html).toContain("$x_1 * y_1 + a_n$");
			expect(html).not.toContain("<code>$E = mc^2$</code>");

			// 3. Block formulas are cleanly wrapped in <p>$$...$$</p> without ```
			expect(html).toContain("<p>$$<br>E = \\sqrt{(mc^2)^2 + (pc)^2}<br>$$</p>");
			expect(html).toContain("<p>$$<br>\\sum_{i=1}^{n} x_i * y_i = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi<br>$$</p>");

			// 4. Underscores in math are NOT converted to italics (<i>)
			expect(html).not.toContain("<i>i * y</i>");
			expect(html).not.toContain("<i>int");
		});

		describe("Empty Line and Break Preservation (Philosophy A)", () => {
			it("preserves empty lines between blockquotes", () => {
				const md1 = "> Quote 1\n\n> Quote 2";
				expect(convertToSlackMobileHtml(md1)).toBe("<p>&gt; Quote 1</p><p><br></p><p>&gt; Quote 2</p>");

				const md2 = "> Quote 1\n\n\n> Quote 2";
				expect(convertToSlackMobileHtml(md2)).toBe("<p>&gt; Quote 1</p><p><br></p><p><br></p><p>&gt; Quote 2</p>");
			});

			it("preserves empty lines between list and heading", () => {
				const withEmptyLine = "- item 1\n- item 2\n\n# Heading";
				expect(convertToSlackMobileHtml(withEmptyLine)).toBe("<ul><li>item 1</li><li>item 2</li></ul><p><br></p><p><b>Heading</b></p>");

				const withoutEmptyLine = "- item 1\n- item 2\n# Heading";
				expect(convertToSlackMobileHtml(withoutEmptyLine)).toBe("<ul><li>item 1</li><li>item 2</li></ul><p><b>Heading</b></p>");
			});

			it("preserves empty lines between code block and table", () => {
				const md = "```ts\nconst x = 1;\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |";
				const html = convertToSlackMobileHtml(md);
				expect(html).toContain("</p><p><br></p><p>```");
			});

			it("faithfully preserves 0, 1, and 2 empty lines between paragraphs", () => {
				const consecutive = "Line 1\nLine 2";
				expect(convertToSlackMobileHtml(consecutive)).toBe("<p>Line 1<br>Line 2</p>");

				const oneEmpty = "Line 1\n\nLine 2";
				expect(convertToSlackMobileHtml(oneEmpty)).toBe("<p>Line 1</p><p><br></p><p>Line 2</p>");

				const twoEmpty = "Line 1\n\n\nLine 2";
				expect(convertToSlackMobileHtml(twoEmpty)).toBe("<p>Line 1</p><p><br></p><p><br></p><p>Line 2</p>");
			});

			it("preserves spacing between inline text and block elements", () => {
				const textThenQuote0 = "Text\n> Quote";
				expect(convertToSlackMobileHtml(textThenQuote0)).toBe("<p>Text</p><p>&gt; Quote</p>");

				const textThenQuote1 = "Text\n\n> Quote";
				expect(convertToSlackMobileHtml(textThenQuote1)).toBe("<p>Text</p><p><br></p><p>&gt; Quote</p>");

				const quoteThenText0 = "> Quote\nText";
				expect(convertToSlackMobileHtml(quoteThenText0)).toBe("<p>&gt; Quote</p><p>Text</p>");

				const quoteThenText1 = "> Quote\n\nText";
				expect(convertToSlackMobileHtml(quoteThenText1)).toBe("<p>&gt; Quote</p><p><br></p><p>Text</p>");
			});
		});
	});

	describe("Platform Branching (convertMarkdown)", () => {
		const sampleMd = "# Test\n**Hello**";

		it("returns text/html and plain text when isMobile is true", () => {
			const res = convertMarkdown(sampleMd, "slack", true);
			expect(res.label).toBe("Slack");
			expect(res.html).toBeDefined();
			expect(res.html).toContain("<b>Hello</b>");
			expect(res.text).toBe("*Test*\n*Hello*");
			expect(res.customMimeTypes).toBeUndefined();
		});

		it("returns slack/texty Quill Delta when isMobile is false (Desktop)", () => {
			const res = convertMarkdown(sampleMd, "slack", false);
			expect(res.label).toBe("Slack");
			expect(res.html).toBeUndefined();
			expect(res.customMimeTypes).toBeDefined();
			expect(res.customMimeTypes?.["slack/texty"]).toBeDefined();
			expect(res.text).toBeDefined();
		});
	});
});
