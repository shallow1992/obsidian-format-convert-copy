import { describe, expect, it } from "vitest";
import { convertToSlackTexty } from "../src/converters/slackTexty";

describe("convertToSlackTexty", () => {
	it("converts a codeblock with language to Slack native Quill Delta format", () => {
		const md = "```typescript\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}\n```";
		const res = convertToSlackTexty(md);

		// Verify texty JSON
		const parsed = JSON.parse(res.texty);
		expect(parsed).toHaveProperty("ops");
		expect(Array.isArray(parsed.ops)).toBe(true);

		// First op should be language
		expect(parsed.ops[0]).toEqual({ insert: "typescript" });
		expect(parsed.ops[1]).toEqual({ insert: "\n", attributes: { "code-block": true } });

		// Check code lines
		expect(parsed.ops[2]).toEqual({ insert: "function greet(name: string): string {" });
		expect(parsed.ops[3]).toEqual({ insert: "\n", attributes: { "code-block": true } });
		expect(parsed.ops[4]).toEqual({ insert: "    return `Hello, ${name}!`;" });
		expect(parsed.ops[5]).toEqual({ insert: "\n", attributes: { "code-block": true } });
		expect(parsed.ops[6]).toEqual({ insert: "}" });
		expect(parsed.ops[7]).toEqual({ insert: "\n", attributes: { "code-block": true } });

		// Verify text/markdown
		expect(res.markdown).toBe("```\ntypescript\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}\n```");

		// Verify text/plain
		expect(res.plain).toBe("typescript\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}");
	});

	it("converts a codeblock without language tag", () => {
		const md = "```\nconst a = 1;\n```";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		// No language op
		expect(parsed.ops[0]).toEqual({ insert: "const a = 1;" });
		expect(parsed.ops[1]).toEqual({ insert: "\n", attributes: { "code-block": true } });

		expect(res.markdown).toBe("```\nconst a = 1;\n```");
		expect(res.plain).toBe("const a = 1;");
	});

	it("handles blank lines within a codeblock properly", () => {
		const md = "```python\ndef foo():\n\n    pass\n```";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		// python
		expect(parsed.ops[0]).toEqual({ insert: "python" });
		expect(parsed.ops[1]).toEqual({ insert: "\n", attributes: { "code-block": true } });
		// def foo():
		expect(parsed.ops[2]).toEqual({ insert: "def foo():" });
		expect(parsed.ops[3]).toEqual({ insert: "\n", attributes: { "code-block": true } });
		// blank line: only newline with code-block: true
		expect(parsed.ops[4]).toEqual({ insert: "\n", attributes: { "code-block": true } });
		// pass
		expect(parsed.ops[5]).toEqual({ insert: "    pass" });
		expect(parsed.ops[6]).toEqual({ insert: "\n", attributes: { "code-block": true } });
	});

	it("handles text before and after a codeblock with inline styles", () => {
		const md = "Check out this `code` below:\n```js\nconsole.log(42);\n```\nDone!";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		expect(parsed.ops).toContainEqual({ insert: "code", attributes: { code: true } });
		expect(parsed.ops).toContainEqual({ insert: "console.log(42);" });
		expect(parsed.ops).toContainEqual({ insert: "Done!" });
	});
});
