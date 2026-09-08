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
		// WhatsApp converts headings to bold (*Heading*)
		expect(result).toContain("*Heading 1 (Must convert to *Heading 1* bold)*");
		expect(result).not.toContain("# Heading 1");

		// WhatsApp converts **bold** to *bold*
		expect(result).toContain("*Double asterisk bold*");

		// WhatsApp converts ~~strike~~ to ~strike~
		expect(result).toContain("~Double tilde strike~");

		// WhatsApp strips <u>...</u> underline tags
		expect(result).toContain("Underlined HTML text");
		expect(result).not.toContain("<u>");

		// WhatsApp expands [title](url) to title (url)
		expect(result).toContain("Official WhatsApp Site (https://www.whatsapp.com)");
		expect(result).not.toContain("[Official WhatsApp Site]");

		// Checklists
		expect(result).toContain("☐ Incomplete task item");
		expect(result).toContain("☑ Completed task item");

		// Callouts converted to > *[NOTE]*
		expect(result).toContain("> *[NOTE]*");

		// Wikilink alias extraction
		expect(result).toContain("Team Standup");
		expect(result).not.toContain("[[Meeting Notes|Team Standup]]");

		// 2. Snapshot assertion
		expect(result).toMatchSnapshot();
	});
});
