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
	let text = md.replace(/!\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_match: string, rawName: string, rawAlias?: string) => {
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
	text = text.replace(/!\[([^\]]*)\]\(((?:[^()]+|\([^()]*\))+)\)/g, (_match: string, alt: string, url: string) => {
		const cleanAlt = alt.trim();
		const label = cleanAlt ? `image: ${cleanAlt}` : "image";
		return `[${label}](${url})`;
	});

	// 3. Regular Wikilinks ([[note|alias]])
	text = text.replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_match: string, name: string, alias?: string) => {
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
	for (let i = 0; i < trimmed.length; i++) {
		const code = trimmed.charCodeAt(i);
		if (code < 32 || code === 127) {
			return false;
		}
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
	wrapInline: (code: string) => string,
	wrapBlockMath?: (math: string) => string,
	wrapInlineMath?: (math: string) => string
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

		// Match block math fence: $$ starting at line beginning (up to 3 spaces)
		const mathFenceMatch = line.match(/^ {0,3}\$\$(.*)$/);
		if (mathFenceMatch) {
			const restOfLine = mathFenceMatch[1].trim();

			// Single-line block math on its own line: $$ formula $$
			const singleLineMatch = restOfLine.match(/^([\s\S]*?)\$\$\s*$/);
			if (singleLineMatch) {
				const mathContent = singleLineMatch[1].trim();
				if (wrapBlockMath) {
					blocks.push(wrapBlockMath(mathContent));
				} else {
					blocks.push(wrapBlock(`$$\n${mathContent}\n$$`));
				}
				outputLines.push(`${CODE_MARK}${blocks.length - 1}${CODE_MARK}`);
				i++;
				continue;
			}

			// Multi-line block math starting with $$
			const mathLines: string[] = [];
			if (restOfLine !== "") {
				mathLines.push(restOfLine);
			}
			let j = i + 1;
			let closed = false;

			while (j < lines.length) {
				const closeMatch = lines[j].match(/^ {0,3}\$\$\s*$/);
				if (closeMatch) {
					closed = true;
					break;
				}
				mathLines.push(lines[j]);
				j++;
			}

			if (closed) {
				const mathContent = mathLines.join("\n").trim();
				if (wrapBlockMath) {
					blocks.push(wrapBlockMath(mathContent));
				} else {
					blocks.push(wrapBlock(`$$\n${mathContent}\n$$`));
				}
				outputLines.push(`${CODE_MARK}${blocks.length - 1}${CODE_MARK}`);
				i = j + 1;
				continue;
			}
		}

		// Match multi-line block math opening at end of line: "prefix $$\nmath\n$$"
		const endMathMatch = line.match(/^(.*?)\s*\$\$\s*$/);
		if (endMathMatch) {
			const prefix = endMathMatch[1];
			const mathLines: string[] = [];
			let j = i + 1;
			let closed = false;

			while (j < lines.length) {
				const closeMatch = lines[j].match(/^ {0,3}\$\$\s*$/);
				if (closeMatch) {
					closed = true;
					break;
				}
				mathLines.push(lines[j]);
				j++;
			}

			if (closed) {
				const mathContent = mathLines.join("\n").trim();
				if (wrapBlockMath) {
					blocks.push(wrapBlockMath(mathContent));
				} else {
					blocks.push(wrapBlock(`$$\n${mathContent}\n$$`));
				}
				if (prefix.length > 0) {
					outputLines.push(prefix);
				}
				outputLines.push(`${CODE_MARK}${blocks.length - 1}${CODE_MARK}`);
				i = j + 1;
				continue;
			}
		}

		if (line.includes("`")) {
			const replaced = line.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_match: string, _ticks: string, code: string) => {
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

	// 1. Extract and protect inline math ($...$) while avoiding false positives for currency ($100)
	intermediateText = intermediateText.replace(
		/(?<!\\|\$)\$([^\s$](?:[^$\n]*?[^\s$])?)\$(?!\d|\$)/g,
		(_match: string, math: string) => {
			if (wrapInlineMath) {
				blocks.push(wrapInlineMath(math));
			} else {
				blocks.push(wrapInline(`$${math}$`));
			}
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

interface GraphemeSegmenter {
	segment(input: string): Iterable<{ segment: string }>;
}

/**
 * Safely initializes an Intl.Segmenter instance for grapheme cluster boundary analysis.
 * Returns null if the runtime does not support Intl.Segmenter.
 */
function initGraphemeSegmenter(): GraphemeSegmenter | null {
	try {
		if (typeof Intl !== "undefined") {
			const intlGlobal = Intl as unknown as {
				Segmenter?: new (locales?: unknown, options?: unknown) => GraphemeSegmenter;
			};
			if (intlGlobal.Segmenter) {
				return new intlGlobal.Segmenter(undefined, { granularity: "grapheme" });
			}
		}
	} catch {
		// Fall back to Array.from when Intl.Segmenter is unavailable or fails
	}
	return null;
}

const graphemeSegmenter: GraphemeSegmenter | null = initGraphemeSegmenter();

/**
 * Checks if a Unicode code point falls within known emoji or symbol ranges.
 */
function isEmojiOrSymbol(code: number): boolean {
	return (
		(code >= 0x1f300 && code <= 0x1faff) || // Standard emojis (🚀, 📝, 🎉, etc.)
		(code >= 0x2600 && code <= 0x27bf) ||   // Miscellaneous Symbols & Dingbats (☀️, ✈️, ⭐, etc.)
		(code >= 0x1f100 && code <= 0x1f2ff) || // Enclosed Alphanumeric / Ideographic Supplement (Regional indicators, etc.)
		(code >= 0x1f000 && code <= 0x1f0ff) || // Mahjong & Playing Cards
		(code >= 0x231a && code <= 0x231b) ||   // Watch, Hourglass
		(code >= 0x23e9 && code <= 0x23f3) ||   // Audio/video symbols
		(code >= 0x23f8 && code <= 0x23fa) ||
		code === 0x2b50 || code === 0x2b55      // ⭐, ⭕
	);
}

/**
 * Checks if a Unicode code point belongs to full-width East Asian CJK ranges (UAX #11).
 */
function isFullWidthCjk(code: number): boolean {
	return (
		(code >= 0x1100 && code <= 0x115f) ||   // Hangul Jamo
		(code >= 0x2e80 && code <= 0xa4cf) ||   // CJK Radicals, Ideographs, Yi
		(code >= 0xac00 && code <= 0xd7a3) ||   // Hangul Syllables
		(code >= 0xf900 && code <= 0xfaff) ||   // CJK Compatibility Ideographs
		(code >= 0xfe10 && code <= 0xfe19) ||   // Vertical Forms
		(code >= 0xfe30 && code <= 0xfe6f) ||   // CJK Compatibility Forms
		(code >= 0xff00 && code <= 0xff60) ||   // Fullwidth ASCII variants & punctuation
		(code >= 0xffe0 && code <= 0xffe6) ||   // Fullwidth Signs
		(code >= 0x20000 && code <= 0x323af)    // CJK Unified Ideographs Extensions B-I (Plane 2, e.g. 𠮷)
	);
}

/**
 * Checks if a code point is a non-spacing, zero-width character (joiners, selectors, diacritics).
 */
function isZeroWidthCodePoint(code: number): boolean {
	return (
		code === 0x200b || // Zero-width space
		code === 0x200c || // Zero-width non-joiner (ZWNJ)
		code === 0x200d || // Zero-width joiner (ZWJ)
		code === 0xfeff || // Byte order mark (BOM)
		(code >= 0xfe00 && code <= 0xfe0f) ||   // Variation Selectors (VS1-VS16)
		(code >= 0xe0100 && code <= 0xe01ef) || // Variation Selectors Supplement
		(code >= 0x0300 && code <= 0x036f) ||   // Combining Diacritical Marks
		(code >= 0x1f3fb && code <= 0x1f3ff)    // Emoji Modifier (Fitzpatrick skin tones)
	);
}

/**
 * Determines the display width of a single grapheme cluster in monospace cells.
 */
function getGraphemeWidth(grapheme: string): number {
	if (!grapheme) return 0;

	// Check for compound emoji or sequences (e.g. ZWJ sequences, flags, emoji with variation selector)
	if (grapheme.includes("\u200D") || grapheme.includes("\uFE0F")) {
		return 2;
	}

	const firstCode = grapheme.codePointAt(0);
	if (firstCode === undefined) return 0;

	// Single zero-width code points
	if (isZeroWidthCodePoint(firstCode)) return 0;

	// Half-width Katakana (explicitly width 1)
	if (firstCode >= 0xff61 && firstCode <= 0xff9f) return 1;

	// Standard ASCII
	if (firstCode >= 0x20 && firstCode <= 0x7e) return 1;

	// Full-width CJK or Emoji
	if (isFullWidthCjk(firstCode) || isEmojiOrSymbol(firstCode)) {
		return 2;
	}

	return 1;
}

/**
 * Calculates the visible column width of a string in monospace cells,
 * taking into account Unicode grapheme clusters, surrogate pairs, and full-width characters.
 */
export function getStringWidth(str: string): number {
	if (!str) return 0;
	let width = 0;
	if (graphemeSegmenter) {
		for (const segment of graphemeSegmenter.segment(str)) {
			width += getGraphemeWidth(segment.segment);
		}
	} else {
		for (const char of Array.from(str)) {
			width += getGraphemeWidth(char);
		}
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
