# Slack Internal Clipboard Specification (`slack/texty`)

This document details the reverse-engineered architecture, data structures, and implementation specifications for Slack's proprietary rich text clipboard format: **`slack/texty`**.

Because Slack has not publicly documented or standardized its internal clipboard format, this knowledge base exists to preserve reverse-engineered findings and prevent future contributors or AI coding assistants from needing to re-investigate the clipboard pipeline from scratch.

---

## 1. Background: Why Standard `text/html` Fails

In standard web applications, copying rich text to the clipboard involves writing `text/html` (e.g., `<pre><code>...</code></pre>`, `<ul><li>...</li></ul>`). However, Slack's desktop and web message composer (an Electron/browser-based rich text editor) subjects external HTML to a strict and often destructive sanitizer/parser:

1. **Code Block Fragmentation**:
   - Multi-line `<pre><code>` blocks are dismantled by Slack into individual, single-line inline code chips (`<code>` chips).
   - Language tags and multi-line code formatting blocks disappear completely.
2. **List Flattening and Duplication**:
   - Deeply nested `<ul>` and `<ol>` hierarchies often lose indentation or duplicate bullet glyphs (e.g., pasting `•• item`).
3. **Blockquote / Callout Stripping**:
   - `<blockquote>` tags can be merged into paragraphs without Slack's distinctive vertical gray quote bar.

### The Solution: `slack/texty`
When a user copies rich text within Slack itself, Slack writes a proprietary MIME type to the system clipboard: **`slack/texty`**.
By synthesizing this format directly, our plugin bypasses Slack's external HTML sanitizer entirely. Slack recognizes the clipboard data as native internal content, restoring 100% of rich containers (native code blocks with syntax highlighting, multi-level nested lists, quote containers, inline styles).

---

## 2. Payload Structure: Quill Delta JSON

The data payload for `slack/texty` is a JSON-serialized **Quill Delta** object containing an array of operational delta objects:

```json
{
  "ops": [
    { "insert": "Hello " },
    { "insert": "World", "attributes": { "bold": true } },
    { "insert": "\n" }
  ]
}
```

### Core Architecture Principle: Block Attributes on Trailing `\n`
In Quill Delta:
- **Inline styles** (`bold`, `italic`, `strike`, `code`, `link`) are applied directly to the text snippet `insert` operation.
- **Block-level containers** (`code-block`, `list`, `blockquote`, `indent`) are applied to the **trailing newline (`\n`)** that terminates that block.

---

## 3. Element Specifications

### 3.1 Code Blocks (`code-block: true`)
A native Slack code block container is formed by setting `attributes: { "code-block": true }` on every newline in the code block.

```json
[
  { "insert": "typescript" },
  { "insert": "\n", "attributes": { "code-block": true } },
  { "insert": "function greet(name: string): string {" },
  { "insert": "\n", "attributes": { "code-block": true } },
  { "insert": "    return `Hello, ${name}!`;" },
  { "insert": "\n", "attributes": { "code-block": true } },
  { "insert": "}" },
  { "insert": "\n", "attributes": { "code-block": true } }
]
```
- **Line 1 (Optional)**: Language identifier (e.g., `typescript`, `python`, `json`, `bash`). Slack will auto-detect syntax highlighting based on this first line.
- **Subsequent Lines**: The actual code lines. Every trailing newline must carry `{"code-block": true}`.

### 3.2 Lists & The 5-Level Nesting Constraint

Slack supports two list types:
- Bulleted lists: `attributes: { "list": "bullet" }`
- Numbered lists: `attributes: { "list": "ordered" }`

Sub-items specify nesting depth using the `indent` attribute:

```json
[
  { "insert": "Root Item" },
  { "insert": "\n", "attributes": { "list": "ordered" } },
  { "insert": "Nested Item Level 2" },
  { "insert": "\n", "attributes": { "list": "ordered", "indent": 1 } },
  { "insert": "Nested Item Level 3" },
  { "insert": "\n", "attributes": { "list": "ordered", "indent": 2 } }
]
```

#### Slack's Maximum Nesting Depth & Overflow Reset (Critical Knowledge)
Slack supports a maximum nesting depth of **5 levels** (`indent: 0` to `indent: 4`). Each level corresponds to specific rendered bullet / numbering styles:

| Level | Delta Attribute | Numbered List Glyph | Bullet List Glyph |
| :--- | :--- | :--- | :--- |
| **Level 1 (Root)** | `{ list: "..." }` (no indent) | `1.` (Decimal) | `•` (Solid disc) |
| **Level 2** | `{ list: "...", indent: 1 }` | `a.` (Lowercase alpha) | `◦` (Open circle) |
| **Level 3** | `{ list: "...", indent: 2 }` | `i.` (Roman numeral) | `▪` (Solid square) |
| **Level 4** | `{ list: "...", indent: 3 }` | `1.` (Decimal) | `•` (Solid disc) |
| **Level 5 (Max)** | `{ list: "...", indent: 4 }` | `a.` (Lowercase alpha) | `◦` (Open circle) |

#### Destructive Behavior on Overflow
If an indent value of `5` or greater (e.g. `indent: 6`) is passed to Slack, **Slack rejects the indent as invalid and forces the line back to root level (`indent: 0`)**, resetting numbered items to `2.` or bullet items to root.

#### Solution: `IndentTracker`
The converter employs an `IndentTracker` class that:
1. Tracks relative indentation stacks across consecutive list items (handling 2-space, 3-space, 4-space, or tab indents uniformly).
2. Clamps the calculated depth with `Math.min(4, level)` to guarantee that depth never exceeds Slack's maximum depth of 4.

### 3.3 Checklists / Task Lists
Because Slack does not have an active checkbox Delta attribute in standard messages, tasks are represented using bullet list styling with Unicode box glyphs:
- Uncompleted task: `☐ ` + text (`{ list: "bullet" }`)
- Completed task: `☑ ` + struck-through text (`{ strike: true }`, `{ list: "bullet" }`)

### 3.4 Blockquotes & Obsidian Callouts
- **Blockquote**: Trailing `\n` has `{ "blockquote": true }`. Renders with Slack's vertical gray quote line.
- **Obsidian Callouts** (`> [!NOTE] Title`): Transformed into bold title prefixes `[NOTE: Title]` with `{ bold: true }` followed by quoted body lines `{ blockquote: true }`.

### 3.5 Tables & The CJK Width Limitation
Slack has no native table Delta element. Markdown tables are converted into **monospaced aligned code blocks (`code-block: true`)**.

#### Known Limitation: CJK Font Fallback
- `formatAlignedTable` computes column widths using standard East Asian Width (CJK characters = 2 half-width spaces).
- However, Slack's code block font stack (`Monaco, Menlo, Consolas, "Courier New", monospace`) does not include Japanese/Chinese/Korean glyphs.
- OS font fallback substitutes a system CJK font (e.g., Hiragino Sans on macOS). The glyph width of this fallback font does not strictly match a 2:1 ratio against Menlo's monospace space character width.
- Consequently, while ASCII tables align with millimeter precision, mixed Japanese/English tables will show minor vertical pipe (`|`) variations between rows. This is an unavoidable limitation of Slack's font stack.

---

## 4. Clipboard API Implementation

### Desktop (Obsidian Desktop / Electron)
We write multiple clipboard representations simultaneously using the Web `ClipboardItem` API:

```typescript
const textyBlob = new Blob([textyJson], { type: "slack/texty" });
const textBlob = new Blob([plainMrkdwn], { type: "text/plain" });
const mdBlob = new Blob([cleanMarkdown], { type: "text/markdown" });

const item = new ClipboardItem({
  "slack/texty": textyBlob,
  "text/plain": textBlob,
  "text/markdown": mdBlob,
});
await navigator.clipboard.write([item]);
```

### Mobile (iOS / Android WebViews)
Mobile WebViews often restrict writing arbitrary custom MIME types via `navigator.clipboard.write`. Therefore, a robust fallback chain writes `text/plain` (Slack mrkdwn syntax) on mobile devices.

---

## 5. Reverse-Engineering & Testing Tools

- **`clipboard-test.html`**: A standalone browser-based tool located in the repository root. Open this file in any browser and click **"Inspect Clipboard"** after copying anything in Slack to inspect the raw `slack/texty` JSON, `text/html`, and `text/plain` streams in real time.
