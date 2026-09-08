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
});
