import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { convertToSlackTexty } from "../src/converters/slackTexty";
import { assertSlackDeltaValid, validateSlackDelta } from "./helpers/validateSlackDelta";

describe("Slack Texty Automated Testing & Validation", () => {
	describe("validateSlackDelta Invariant Checker", () => {
		it("accepts valid Slack Texty Delta", () => {
			const valid = {
				ops: [
					{ insert: "Hello " },
					{ insert: "World", attributes: { bold: true } },
					{ insert: "\n" },
					{ insert: "Item 1" },
					{ insert: "\n", attributes: { list: "bullet", indent: 2 } },
				],
			};
			const res = validateSlackDelta(valid);
			expect(res.valid).toBe(true);
			expect(res.errors).toHaveLength(0);
		});

		it("detects overflow indents > 4 (Slack constraint)", () => {
			const invalid = {
				ops: [
					{ insert: "Bad nesting" },
					{ insert: "\n", attributes: { list: "ordered", indent: 5 } },
				],
			};
			const res = validateSlackDelta(invalid);
			expect(res.valid).toBe(false);
			expect(res.errors[0].message).toContain("Slack hard limit violation");
		});

		it("detects block attributes placed on non-newline strings", () => {
			const invalid = {
				ops: [{ insert: "Text with block attr", attributes: { "code-block": true } }],
			};
			const res = validateSlackDelta(invalid);
			expect(res.valid).toBe(false);
			expect(res.errors[0].message).toContain("Block attribute 'code-block' found on an op that does not end with a newline");
		});
	});

	describe("Snapshot Testing of Comprehensive Manual Test Suite", () => {
		it("converts tests/manual/slack-comprehensive-test.md with zero invariant violations and matches snapshot", () => {
			const suitePath = path.resolve(__dirname, "manual/slack-comprehensive-test.md");
			const content = fs.readFileSync(suitePath, "utf-8");

			const result = convertToSlackTexty(content);
			const parsed = JSON.parse(result.texty);

			// 1. Strict invariant validation
			assertSlackDeltaValid(parsed);

			// 2. Structural assertions
			expect(parsed.ops.length).toBeGreaterThan(50);

			// Ensure all list indents are strictly <= 4
			const listOps = parsed.ops.filter((op: any) => op.attributes?.list);
			for (const op of listOps) {
				if (op.attributes.indent !== undefined) {
					expect(op.attributes.indent).toBeGreaterThanOrEqual(0);
					expect(op.attributes.indent).toBeLessThanOrEqual(4);
				}
			}

			// Ensure code-block ops exist (codeblocks & tables)
			const codeBlockOps = parsed.ops.filter((op: any) => op.attributes?.["code-block"]);
			expect(codeBlockOps.length).toBeGreaterThan(10);

			// 3. Snapshot assertion to freeze regression protection
			expect(parsed).toMatchSnapshot();
		});

		it("converts tests/manual/slack-edge-cases.md with zero invariant violations and matches snapshot", () => {
			const suitePath = path.resolve(__dirname, "manual/slack-edge-cases.md");
			const content = fs.readFileSync(suitePath, "utf-8");

			const result = convertToSlackTexty(content);
			const parsed = JSON.parse(result.texty);

			assertSlackDeltaValid(parsed);
			expect(parsed.ops.length).toBeGreaterThan(20);

			expect(parsed).toMatchSnapshot();
		});
	});
});
