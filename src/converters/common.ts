export const CODE_MARK = "\uE000";
export const BOLD_MARK = "\uE001";
export const UNDERLINE_MARK = "\uE002";

export interface CodeExtraction {
	text: string;
	blocks: string[];
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp", "avif", "ico"]);
const AUDIO_VIDEO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "ogg", "mp4", "webm", "mov", "mkv"]);

/**
 * Resolves embedded links (![[...]]), image markdown (![alt](url)), and Wikilinks ([[...]]).
 */
export function resolveWikilinks(md: string): string {
	// 1. Embedded Wikilinks (![[filename|alias/size]])
	let text = md.replace(/!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_match, rawName, rawAlias) => {
		const name = rawName.trim();
		const alias = rawAlias ? rawAlias.trim() : "";
		const hasExt = name.includes(".");
		const ext = hasExt ? name.split(".").pop()?.toLowerCase() ?? "" : "";

		// Dimension specifiers (e.g., |300, |300x200) are sizes rather than aliases; exclude them
		const isDimension = /^\d+(x\d+)?$/i.test(alias);
		const displayLabel = alias && !isDimension ? alias : name;

		if (IMAGE_EXTENSIONS.has(ext)) {
			return `[image: ${displayLabel}]`;
		}
		if (AUDIO_VIDEO_EXTENSIONS.has(ext)) {
			return `[media: ${displayLabel}]`;
		}
		if (ext && ext !== "md") {
			return `[attachment: ${displayLabel}]`;
		}
		return `[embedded: ${displayLabel}]`;
	});

	// 2. Normalize standard Markdown images (![alt](url)) to [image: alt](url)
	text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
		const cleanAlt = alt.trim();
		const label = cleanAlt ? `image: ${cleanAlt}` : "image";
		return `[${label}](${url})`;
	});

	// 3. Regular Wikilinks ([[note|alias]])
	text = text.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_match, name, alias) => {
		return alias || name;
	});

	return text;
}

/**
 * Escapes HTML special characters.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * Validates the safety of a URL scheme.
 * Permits safe schemes like http, https, mailto, tel, obsidian, or in-page anchors (#).
 * Blocks dangerous schemes such as javascript: or data:.
 */
export function isSafeUrl(rawUrl: string): boolean {
	const trimmed = rawUrl.trim();
	if (trimmed.startsWith("#")) {
		return true;
	}
	// Reject control characters (ASCII 0-31, 127)
	if (/[\x00-\x1F\x7F]/.test(trimmed)) {
		return false;
	}
	return /^(https?|mailto|tel|obsidian):/i.test(trimmed);
}

/**
 * Safely extracts code fences (``` or ~~~ of 3+ length), inline code, LaTeX math, and tables
 * and stashes them into placeholders.
 */
export function extractCodeBlocks(
	source: string,
	wrapBlock: (code: string, lang?: string) => string,
	wrapInline: (code: string) => string
): CodeExtraction {
	const lines = source.split("\n");
	const blocks: string[] = [];
	const outputLines: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		// Match opening code fence: 3 or more backticks or tildes, optionally preceded by up to 3 spaces
		const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);

		if (fenceMatch) {
			const fenceStr = fenceMatch[1];
			const fenceChar = fenceStr[0];
			const fenceLen = fenceStr.length;
			const lang = fenceMatch[2].trim();

			// For backtick fences, the info string / lang cannot contain backticks per CommonMark
			if (!(fenceChar === "`" && lang.includes("`"))) {
				const codeLines: string[] = [];
				let j = i + 1;
				let closed = false;

				while (j < lines.length) {
					const closeMatch = lines[j].match(/^ {0,3}(`{3,}|~{3,})\s*$/);
					if (closeMatch && closeMatch[1][0] === fenceChar && closeMatch[1].length >= fenceLen) {
						closed = true;
						break;
					}
					codeLines.push(lines[j]);
					j++;
				}

				blocks.push(wrapBlock(codeLines.join("\n"), lang));
				outputLines.push(`${CODE_MARK}${blocks.length - 1}${CODE_MARK}`);
				i = closed ? j + 1 : lines.length;
				continue;
			}
		}

		if (line.includes("`")) {
			const replaced = line.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_match, _ticks, code) => {
				blocks.push(wrapInline(code));
				return `${CODE_MARK}${blocks.length - 1}${CODE_MARK}`;
			});
			outputLines.push(replaced);
			i++;
			continue;
		}

		outputLines.push(line);
		i++;
	}

	let intermediateText = outputLines.join("\n");

	// 1. Extract and protect block math ($$...$$)
	intermediateText = intermediateText.replace(/(?<!\\)\$\$([\s\S]+?)\$\$/g, (_match, math) => {
		const trimmedMath = math.trim();
		blocks.push(wrapBlock(`$$\n${trimmedMath}\n$$`));
		return `${CODE_MARK}${blocks.length - 1}${CODE_MARK}`;
	});

	// 2. Extract and protect inline math ($...$) while avoiding false positives for currency ($100)
	intermediateText = intermediateText.replace(
		/(?<!\\|\$)\$([^\s\$](?:[^$\n]*?[^\s\$])?)\$(?!\d|\$)/g,
		(_match, math) => {
			blocks.push(wrapInline(`$${math}$`));
			return `${CODE_MARK}${blocks.length - 1}${CODE_MARK}`;
		}
	);

	// 3. Extract and align table syntax (tables outside of code blocks)
	const processedText = extractTables(intermediateText, blocks, wrapBlock);

	return { text: processedText, blocks };
}

/**
 * Restores placeholders back to actual code blocks.
 */
export function restoreCodeBlocks(text: string, blocks: string[]): string {
	const pattern = new RegExp(`${CODE_MARK}(\\d+)${CODE_MARK}`, "g");
	return text.replace(pattern, (_match, i) => blocks[Number(i)] ?? "");
}

export type TableAlignment = "left" | "center" | "right";

function getCharWidth(char: string): number {
	const code = char.codePointAt(0);
	if (!code) return 0;
	if (code >= 0xff61 && code <= 0xff9f) return 1;
	if (
		(code >= 0x1100 && code <= 0x115f) ||
		(code >= 0x2e80 && code <= 0xa4cf) ||
		(code >= 0xac00 && code <= 0xd7a3) ||
		(code >= 0xf900 && code <= 0xfaff) ||
		(code >= 0xfe10 && code <= 0xfe19) ||
		(code >= 0xfe30 && code <= 0xfe6f) ||
		(code >= 0xff00 && code <= 0xff60) ||
		(code >= 0xffe0 && code <= 0xffe6)
	) {
		return 2;
	}
	return 1;
}

export function getStringWidth(str: string): number {
	let width = 0;
	for (const char of str) {
		width += getCharWidth(char);
	}
	return width;
}

function parseTableRow(line: string): string[] {
	let trimmed = line.trim();
	if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
	if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
	return trimmed.split("|").map((cell) => cell.trim());
}

export function isTableSeparatorRow(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed.includes("|") && !trimmed.startsWith("-")) return false;
	const cells = parseTableRow(trimmed);
	if (cells.length === 0) return false;
	return cells.every((cell) => /^:?-+:?$/.test(cell));
}

function getTableAlignment(cell: string): TableAlignment {
	const left = cell.startsWith(":");
	const right = cell.endsWith(":");
	if (left && right) return "center";
	if (right) return "right";
	return "left";
}

function padTableCell(text: string, width: number, align: TableAlignment): string {
	const diff = width - getStringWidth(text);
	if (diff <= 0) return text;
	if (align === "right") {
		return " ".repeat(diff) + text;
	} else if (align === "center") {
		const left = Math.floor(diff / 2);
		const right = diff - left;
		return " ".repeat(left) + text + " ".repeat(right);
	} else {
		return text + " ".repeat(diff);
	}
}

function formatTableSeparator(width: number, align: TableAlignment): string {
	if (align === "center") {
		return ":" + "-".repeat(Math.max(1, width)) + ":";
	} else if (align === "right") {
		return "-".repeat(Math.max(2, width + 1)) + ":";
	} else if (align === "left") {
		return ":" + "-".repeat(Math.max(2, width + 1));
	} else {
		return "-".repeat(Math.max(3, width + 2));
	}
}

/**
 * Formats multi-line Markdown tables into monospaced aligned text.
 */
export function formatAlignedTable(tableLines: string[]): string {
	const rows = tableLines.map(parseTableRow);
	if (rows.length < 2) return tableLines.join("\n");

	const colCount = Math.max(...rows.map((r) => r.length));
	for (const row of rows) {
		while (row.length < colCount) {
			row.push("");
		}
	}

	const separatorRow = rows[1];
	const alignments: TableAlignment[] = [];
	for (let c = 0; c < colCount; c++) {
		alignments.push(getTableAlignment(separatorRow[c] || "---"));
	}

	const colWidths: number[] = [];
	for (let c = 0; c < colCount; c++) {
		let maxWidth = 3;
		for (let r = 0; r < rows.length; r++) {
			if (r === 1) continue;
			const w = getStringWidth(rows[r][c]);
			if (w > maxWidth) maxWidth = w;
		}
		colWidths.push(maxWidth);
	}

	const formattedRows: string[] = [];
	for (let r = 0; r < rows.length; r++) {
		if (r === 1) {
			const sepCells = colWidths.map((w, c) => formatTableSeparator(w, alignments[c]));
			formattedRows.push("|" + sepCells.join("|") + "|");
		} else {
			const dataCells = rows[r].map((cell, c) => padTableCell(cell, colWidths[c], alignments[c]));
			formattedRows.push("| " + dataCells.join(" | ") + " |");
		}
	}

	return formattedRows.join("\n");
}

/**
 * Detects Markdown table syntax and converts/stashes them
 * into aligned code block representations.
 */
export function extractTables(
	text: string,
	blocks: string[],
	wrapBlock: (code: string, lang?: string) => string
): string {
	const lines = text.split("\n");
	const outputLines: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		// Detect table start (line contains pipes and is immediately followed by a separator row)
		if (line.includes("|") && i + 1 < lines.length && isTableSeparatorRow(lines[i + 1])) {
			const tableLines: string[] = [line, lines[i + 1]];
			let j = i + 2;
			while (j < lines.length && lines[j].trim().includes("|") && lines[j].trim() !== "") {
				tableLines.push(lines[j]);
				j++;
			}

			const alignedTable = formatAlignedTable(tableLines);
			blocks.push(wrapBlock(alignedTable));
			outputLines.push(`${CODE_MARK}${blocks.length - 1}${CODE_MARK}`);
			i = j;
			continue;
		}

		outputLines.push(line);
		i++;
	}

	return outputLines.join("\n");
}
