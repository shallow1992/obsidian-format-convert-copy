export interface DeltaValidationError {
	index: number;
	op: any;
	message: string;
}

export interface DeltaValidationResult {
	valid: boolean;
	errors: DeltaValidationError[];
}

/**
 * Validates that a Quill Delta JSON object strictly complies with Slack's Texty
 * internal constraints and invariants.
 */
export function validateSlackDelta(deltaJson: string | object): DeltaValidationResult {
	let delta: any;
	if (typeof deltaJson === "string") {
		try {
			delta = JSON.parse(deltaJson);
		} catch (e: any) {
			return {
				valid: false,
				errors: [{ index: -1, op: null, message: `Invalid JSON: ${e.message}` }],
			};
		}
	} else {
		delta = deltaJson;
	}

	if (!delta || typeof delta !== "object" || !Array.isArray(delta.ops)) {
		return {
			valid: false,
			errors: [{ index: -1, op: delta, message: "Root object must have an 'ops' array" }],
		};
	}

	const errors: DeltaValidationError[] = [];
	const ops = delta.ops;

	for (let i = 0; i < ops.length; i++) {
		const op = ops[i];

		// 1. Each op must have string insert
		if (typeof op.insert !== "string") {
			errors.push({ index: i, op, message: "Op 'insert' must be a string" });
			continue;
		}

		const attrs = op.attributes;
		if (!attrs) continue;

		// 2. Block-level attributes check
		const isNewline = op.insert.endsWith("\n");
		const blockAttrs = ["code-block", "list", "blockquote", "indent"];

		for (const key of blockAttrs) {
			if (attrs[key] !== undefined && !isNewline) {
				errors.push({
					index: i,
					op,
					message: `Block attribute '${key}' found on an op that does not end with a newline '\\n'`,
				});
			}
		}

		// 3. Indent attribute check: 0 <= indent <= 4 (Slack hard limit)
		if (attrs.indent !== undefined) {
			if (typeof attrs.indent !== "number" || !Number.isInteger(attrs.indent)) {
				errors.push({
					index: i,
					op,
					message: `'indent' must be an integer, got: ${attrs.indent}`,
				});
			} else if (attrs.indent < 0 || attrs.indent > 4) {
				errors.push({
					index: i,
					op,
					message: `Slack hard limit violation: 'indent' must be between 0 and 4 inclusive, got: ${attrs.indent}`,
				});
			}
		}

		// 4. List attribute check
		if (attrs.list !== undefined) {
			if (attrs.list !== "bullet" && attrs.list !== "ordered") {
				errors.push({
					index: i,
					op,
					message: `Invalid list attribute '${attrs.list}'. Expected 'bullet' or 'ordered'`,
				});
			}
		}

		// 5. Code block check
		if (attrs["code-block"] !== undefined && attrs["code-block"] !== true) {
			errors.push({
				index: i,
				op,
				message: `'code-block' attribute must be boolean true`,
			});
		}

		// 6. Blockquote check
		if (attrs.blockquote !== undefined && attrs.blockquote !== true) {
			errors.push({
				index: i,
				op,
				message: `'blockquote' attribute must be boolean true`,
			});
		}

		// 7. Inline attributes check
		const inlineBooleans = ["bold", "italic", "strike", "code"];
		for (const key of inlineBooleans) {
			if (attrs[key] !== undefined && attrs[key] !== true) {
				errors.push({
					index: i,
					op,
					message: `Inline attribute '${key}' must be boolean true`,
				});
			}
		}

		if (attrs.link !== undefined && (typeof attrs.link !== "string" || attrs.link.length === 0)) {
			errors.push({
				index: i,
				op,
				message: `'link' attribute must be a non-empty string`,
			});
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Helper assertion function for tests. Throws with informative messages if invalid.
 */
export function assertSlackDeltaValid(deltaJson: string | object): void {
	const res = validateSlackDelta(deltaJson);
	if (!res.valid) {
		const formatted = res.errors
			.map((e) => `[Op ${e.index}] ${e.message} (Op: ${JSON.stringify(e.op)})`)
			.join("\n");
		throw new Error(`Slack Delta Validation Failed:\n${formatted}`);
	}
}
