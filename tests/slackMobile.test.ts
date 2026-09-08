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
			expect(html).toContain("<b>Heading</b>");
			expect(html).toContain("<b>Bold</b> and <i>Italic</i>.");
			expect(html).toContain("Line 1<br>Line 2<br><br>New paragraph");
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
