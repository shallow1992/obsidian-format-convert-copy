import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { convertToDiscord } from "../src/converters/discord";

describe("Discord Format Automated Testing & Snapshot", () => {
	it("converts tests/manual/discord-comprehensive-test.md cleanly and matches snapshot", () => {
		const fixturePath = path.resolve(__dirname, "manual/discord-comprehensive-test.md");
		const content = fs.readFileSync(fixturePath, "utf-8");

		const result = convertToDiscord(content);

		// 1. Semantic assertions
		// Discord preserves markdown headings (#, ##, ###)
		expect(result).toContain("# Heading 1");
		expect(result).toContain("## Heading 2");

		// Discord converts <u>Underline</u> to __Underline__
		expect(result).toContain("__Underlined HTML text__");

		// Discord unifies markdown bold __text__ into **text**
		expect(result).toContain("**bold text with underscores**");

		// Discord task lists: completed task has strikethrough
		expect(result).toContain("☐ Incomplete task item");
		expect(result).toContain("☑ ~~Completed task item~~");

		// Discord callout conversion
		expect(result).toContain("> **[Announcement]**");
		expect(result).toContain("> **[WARNING]**");

		// Wikilink alias extraction
		expect(result).toContain("Community Guidelines");
		expect(result).not.toContain("[[Server Rules|Community Guidelines]]");

		// 2. Snapshot assertion
		expect(result).toMatchSnapshot();
	});
});
