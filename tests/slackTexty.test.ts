import { describe, expect, it } from "vitest";
import { convertToSlackTexty } from "../src/converters/slackTexty";
import { assertSlackDeltaValid } from "./helpers/validateSlackDelta";

describe("convertToSlackTexty", () => {
	it("converts codeblock with language into Slack native format", () => {
		const md = "```typescript\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}\n```";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		expect(parsed.ops[0]).toEqual({ insert: "typescript" });
		expect(parsed.ops[1]).toEqual({ insert: "\n", attributes: { "code-block": true } });
		expect(parsed.ops[2]).toEqual({ insert: "function greet(name: string): string {" });
		expect(parsed.ops[3]).toEqual({ insert: "\n", attributes: { "code-block": true } });
		expect(parsed.ops[4]).toEqual({ insert: "    return `Hello, ${name}!`;" });
		expect(parsed.ops[5]).toEqual({ insert: "\n", attributes: { "code-block": true } });
		expect(parsed.ops[6]).toEqual({ insert: "}" });
		expect(parsed.ops[7]).toEqual({ insert: "\n", attributes: { "code-block": true } });
	});

	it("converts ordered and nested bullet lists matching Slack native data", () => {
		const md = "1. 番号付きリスト\n   - 箇条書き（ネスト）";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		expect(parsed.ops[0]).toEqual({ insert: "番号付きリスト" });
		expect(parsed.ops[1]).toEqual({ insert: "\n", attributes: { list: "ordered" } });
		expect(parsed.ops[2]).toEqual({ insert: "箇条書き（ネスト）" });
		expect(parsed.ops[3]).toEqual({ insert: "\n", attributes: { list: "bullet", indent: 1 } });
	});

	it("converts blockquotes with bold, inline code, and links matching user screenshot", () => {
		const md = "> 引用ブロック **太字 と `インライン`** と [リンク](https://antigravity.google/)";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		// Verify blockquote attribute on trailing newline
		const lastOp = parsed.ops[parsed.ops.length - 1];
		expect(lastOp).toEqual({ insert: "\n", attributes: { blockquote: true } });

		// Verify inline formatting inside blockquote
		expect(parsed.ops).toContainEqual({ insert: "引用ブロック " });
		expect(parsed.ops).toContainEqual({ insert: "太字 と ", attributes: { bold: true } });
		expect(parsed.ops).toContainEqual({ insert: "インライン", attributes: { bold: true, code: true } });
		expect(parsed.ops).toContainEqual({ insert: " と " });
		expect(parsed.ops).toContainEqual({ insert: "リンク", attributes: { link: "https://antigravity.google/" } });
	});

	it("converts Obsidian callouts to bold titled blockquotes", () => {
		const md = "> [!NOTE] 重要なお知らせ\n> 本文です。";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		expect(parsed.ops[0]).toEqual({ insert: "[重要なお知らせ]", attributes: { bold: true } });
		expect(parsed.ops[1]).toEqual({ insert: "\n", attributes: { blockquote: true } });
		expect(parsed.ops[2]).toEqual({ insert: "本文です。" });
		expect(parsed.ops[3]).toEqual({ insert: "\n", attributes: { blockquote: true } });
	});

	it("converts task list checkboxes (unchecked and checked)", () => {
		const md = "- [ ] 未完了タスク\n- [x] 完了タスク";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		expect(parsed.ops[0]).toEqual({ insert: "☐ 未完了タスク" });
		expect(parsed.ops[1]).toEqual({ insert: "\n", attributes: { list: "bullet" } });

		expect(parsed.ops[2]).toEqual({ insert: "☑ " });
		expect(parsed.ops[3]).toEqual({ insert: "完了タスク", attributes: { strike: true } });
		expect(parsed.ops[4]).toEqual({ insert: "\n", attributes: { list: "bullet" } });
	});

	it("converts markdown tables into aligned code blocks", () => {
		const md = "| Header A | Header B |\n| --- | --- |\n| 1 | 2 |";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		// Table rows should have code-block: true
		const codeBlockOps = parsed.ops.filter((op: any) => op.attributes?.["code-block"]);
		expect(codeBlockOps.length).toBeGreaterThan(0);
	});

	it("converts headings to bold text lines", () => {
		const md = "# 大見出し\n## 中見出し";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		expect(parsed.ops[0]).toEqual({ insert: "大見出し", attributes: { bold: true } });
		expect(parsed.ops[1]).toEqual({ insert: "\n" });
		expect(parsed.ops[2]).toEqual({ insert: "中見出し", attributes: { bold: true } });
		expect(parsed.ops[3]).toEqual({ insert: "\n" });
	});

	it("correctly handles 3-space indentation up to 5 levels (indent: 0 to 4)", () => {
		const md = "1. レベル 1\n   1. レベル 2\n      1. レベル 3\n         1. レベル 4\n            1. レベル 5\n2. レベル 1 復帰";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		// Level 1: no indent
		expect(parsed.ops[1]).toEqual({ insert: "\n", attributes: { list: "ordered" } });
		// Level 2: indent 1
		expect(parsed.ops[3]).toEqual({ insert: "\n", attributes: { list: "ordered", indent: 1 } });
		// Level 3: indent 2
		expect(parsed.ops[5]).toEqual({ insert: "\n", attributes: { list: "ordered", indent: 2 } });
		// Level 4: indent 3
		expect(parsed.ops[7]).toEqual({ insert: "\n", attributes: { list: "ordered", indent: 3 } });
		// Level 5: indent 4
		expect(parsed.ops[9]).toEqual({ insert: "\n", attributes: { list: "ordered", indent: 4 } });
		// Level 1 return: no indent
		expect(parsed.ops[11]).toEqual({ insert: "\n", attributes: { list: "ordered" } });
	});

	it("caps indentation at Slack maximum depth (indent: 4) when nesting is deeper than 5 levels", () => {
		const md = "- L1\n  - L2\n    - L3\n      - L4\n        - L5\n          - L6\n            - L7";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		const listOps = parsed.ops.filter((op: any) => op.attributes?.list);
		for (const op of listOps) {
			if (op.attributes.indent !== undefined) {
				expect(op.attributes.indent).toBeLessThanOrEqual(4);
			}
		}
	});

	it("formats tables as aligned code blocks with East Asian full-width character support", () => {
		const md = "| 機能 | 配置 |\n| :--- | ---: |\n| 見出し | 右寄せ |";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);

		const codeBlockOps = parsed.ops.filter((op: any) => op.attributes?.["code-block"]);
		expect(codeBlockOps.length).toBe(3); // header, separator, data row
		// Line 1: Header row padded according to full-width widths
		expect(parsed.ops[0].insert).toBe("| 機能   |   配置 |");
		// Line 2: Separator row with alignments
		expect(parsed.ops[2].insert).toBe("|:-------|-------:|");
		// Line 3: Data row padded correctly
		expect(parsed.ops[4].insert).toBe("| 見出し | 右寄せ |");
	});

	it("handles 10-level deep nesting cleanly capped at indent 4 without breaking", () => {
		const lines = [];
		for (let i = 1; i <= 10; i++) {
			lines.push(" ".repeat((i - 1) * 2) + `1. Level ${i}`);
		}
		const md = lines.join("\n");
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);
		assertSlackDeltaValid(parsed);

		const listOps = parsed.ops.filter((op: any) => op.attributes?.list);
		expect(listOps).toHaveLength(10);
		expect(listOps[0].attributes.indent).toBeUndefined(); // Level 1 (indent 0)
		expect(listOps[1].attributes.indent).toBe(1); // Level 2
		expect(listOps[2].attributes.indent).toBe(2); // Level 3
		expect(listOps[3].attributes.indent).toBe(3); // Level 4
		expect(listOps[4].attributes.indent).toBe(4); // Level 5
		expect(listOps[5].attributes.indent).toBe(4); // Level 6 clamped
		expect(listOps[9].attributes.indent).toBe(4); // Level 10 clamped
	});

	it("handles mixed tab and space indentation seamlessly", () => {
		const md = "- Root\n\t- Tab nested\n\t  - Tab plus spaces nested\n- Back to root";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);
		assertSlackDeltaValid(parsed);

		const listOps = parsed.ops.filter((op: any) => op.attributes?.list);
		expect(listOps[0].attributes.indent).toBeUndefined();
		expect(listOps[1].attributes.indent).toBe(1);
		expect(listOps[2].attributes.indent).toBe(2);
		expect(listOps[3].attributes.indent).toBeUndefined();
	});

	it("handles tables with irregular columns and empty cells without crashing", () => {
		const md = "| Col A | Col B | Col C |\n| --- | --- | --- |\n| Cell 1 |\n| Cell 2 | Cell 3 | Cell 4 | Cell 5 |";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);
		assertSlackDeltaValid(parsed);

		const codeOps = parsed.ops.filter((op: any) => op.attributes?.["code-block"]);
		expect(codeOps.length).toBeGreaterThanOrEqual(3);
	});

	it("handles code blocks containing markdown syntax without interpreting them", () => {
		const md = "```markdown\n# Not a heading\n- Not a list\n| Not | A | Table |\n```";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);
		assertSlackDeltaValid(parsed);

		const listOps = parsed.ops.filter((op: any) => op.attributes?.list);
		expect(listOps).toHaveLength(0);
	});

	it("renders LaTeX block math as code-block and inline math as inline code", () => {
		const md = "Formula $x_1 * y_1$ inline\n$$\n\\sum_{i=1}^n x_i * y_i\n$$\n$$ A = \\pi r^2 $$";
		const res = convertToSlackTexty(md);
		const parsed = JSON.parse(res.texty);
		assertSlackDeltaValid(parsed);

		// Inline math must have code: true
		const inlineMathOp = parsed.ops.find((op: any) => op.insert === "$x_1 * y_1$");
		expect(inlineMathOp).toBeDefined();
		expect(inlineMathOp.attributes?.code).toBe(true);

		// Block math lines must have code-block: true
		const codeBlockNewlineOps = parsed.ops.filter((op: any) => op.insert === "\n" && op.attributes?.["code-block"]);
		expect(codeBlockNewlineOps.length).toBeGreaterThanOrEqual(4);

		// No italic or bold attributes should be present on math
		const italicOps = parsed.ops.filter((op: any) => op.attributes?.italic);
		const boldOps = parsed.ops.filter((op: any) => op.attributes?.bold);
		expect(italicOps).toHaveLength(0);
		expect(boldOps).toHaveLength(0);

		// Math content is preserved
		const text = parsed.ops.map((op: any) => op.insert).join("");
		expect(text).toContain("$x_1 * y_1$");
		expect(text).toContain("\\sum_{i=1}^n x_i * y_i");
		expect(text).toContain("A = \\pi r^2");
	});
});
