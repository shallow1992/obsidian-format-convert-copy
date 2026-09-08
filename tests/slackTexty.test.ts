import { describe, expect, it } from "vitest";
import { convertToSlackTexty } from "../src/converters/slackTexty";

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
});
