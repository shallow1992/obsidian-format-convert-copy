import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { convertToWhatsApp } from "../src/converters/whatsapp";

describe("WhatsApp Format Automated Testing & Snapshot", () => {
	it("converts tests/manual/whatsapp-comprehensive-test.md cleanly and matches snapshot", () => {
		const fixturePath = path.resolve(__dirname, "manual/whatsapp-comprehensive-test.md");
		const content = fs.readFileSync(fixturePath, "utf-8");

		const result = convertToWhatsApp(content);

		// 1. Semantic assertions
		// WhatsApp converts headings to bold (*Heading*) and sanitizes inner conflicting asterisks
		expect(result).toContain("*Heading 1 (Must convert to _Heading 1_ bold)*");
		expect(result).not.toContain("# Heading 1");

		// WhatsApp converts **bold** to *bold*
		expect(result).toContain("*Double asterisk bold*");

		// WhatsApp converts ~~strike~~ to ~strike~
		expect(result).toContain("~Double tilde strike~");

		// WhatsApp strips <u>...</u> underline tags
		expect(result).toContain("Underlined HTML text");
		expect(result).not.toContain("<u>");

		// WhatsApp expands [title](url) to title (url) and preserves underscores in URLs
		expect(result).toContain("Official WhatsApp Site (https://www.whatsapp.com)");
		expect(result).toContain("API Documentation (https://example.com/api_v1_endpoint)");
		expect(result).toContain("https://example.com/webhook_event_trigger");
		expect(result).not.toContain("[Official WhatsApp Site]");
		expect(result).toContain("user_account_id");

		// Checklists
		expect(result).toContain("☐ Incomplete task item");
		expect(result).toContain("☑ Completed task item");

		// Callouts converted to > *[NOTE]* Title or > *[WARNING]*
		expect(result).toContain("> *[NOTE]* Release Update");
		expect(result).toContain("> *[WARNING]*");

		// Wikilink alias extraction
		expect(result).toContain("Team Standup");
		expect(result).not.toContain("[[Meeting Notes|Team Standup]]");

		// 2. Snapshot assertion
		expect(result).toMatchSnapshot();
	});
});
