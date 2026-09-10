# Slack Formatting & Rendering Edge Cases Manual Test Suite

This test note is specifically designed to verify **visual edge cases** that only become apparent upon actual rendering in the Slack desktop and mobile (iOS/Android) apps.

## Verification Checklist for Testers
1. Copy this note via **"Format Convert: Copy as Slack Format"** in Obsidian.
2. Paste into Slack (mobile iOS or desktop composer).
3. Visually inspect each section against the criteria below.

---

## 1. Consecutive Empty Lines & Block Spacing

### Case 1.1: Single vs Multiple Consecutive Blank Lines
Paragraph 1 (First line)

Paragraph 2 (Separated by exactly ONE empty line above)


Paragraph 3 (Separated by exactly TWO empty lines above)



Paragraph 4 (Separated by exactly THREE empty lines above)

- **Verification Criteria**:
  - [ ] Exactly 1 empty line between Paragraph 1 and 2.
  - [ ] Exactly 2 empty lines between Paragraph 2 and 3 (Slack normalizer must NOT collapse to 1).
  - [ ] Exactly 3 empty lines between Paragraph 3 and 4.

### Case 1.2: Soft Line Breaks vs Hard Paragraph Breaks
Line 1 of the same paragraph.
Line 2 of the same paragraph (soft break without empty line).
Line 3 of the same paragraph (soft break without empty line).

New paragraph after a hard empty line.

- **Verification Criteria**:
  - [ ] Lines 1, 2, 3 appear grouped in a single paragraph block with normal line breaks.
  - [ ] The next paragraph is separated by a blank line.

### Case 1.3: Empty Lines Between Blockquotes
> Quote Block A: First independent quotation.
> Line 2 of Quote Block A.

> Quote Block B: Second quotation separated by an empty line above.

- **Verification Criteria**:
  - [ ] Quote Block A and Quote Block B do NOT merge into a single quote.
  - [ ] There is a visible empty line separating Quote Block A and Quote Block B.

### Case 1.4: Empty Lines Between Lists and Headings
- List Item Alpha
- List Item Beta
- List Item Gamma

### Heading Immediately After List (Separated by Empty Line)
Follow-up text under heading.

- **Verification Criteria**:
  - [ ] A visible empty line exists between "List Item Gamma" and the "### Heading".
  - [ ] The heading is NOT squeezed flush against the bottom of the list.

### Case 1.5: Empty Lines Between Code Blocks and Tables
```typescript
interface ServerConfig {
    host: string;
    port: number;
}
```

| Config Key | Type | Default |
| :--- | :--- | :--- |
| `host` | string | "localhost" |
| `port` | number | 8080 |

- **Verification Criteria**:
  - [ ] There is a clean empty line separating the code block and the table.
  - [ ] The table columns remain vertically aligned in monospace font.

### Case 1.6: Empty Lines Between Tables and Block Math
| Metric | Q1 | Q2 |
| :--- | :--- | :--- |
| Revenue | $10M | $12M |

$$
\text{Growth} = \frac{Q2 - Q1}{Q1} \times 100\%
$$

- **Verification Criteria**:
  - [ ] There is a clean empty line between the table and the block formula.
  - [ ] The formula is wrapped in a code block containing `$$` delimiters.

---

## 2. Math & Delimiter Collision Edge Cases

### Case 2.1: Heading Containing `$$` Near Block Math
### Section 2.1: Verifying $$ and $ Delimiters in Prose

Here is the formula below that must NOT be accidentally merged with the header:
$$
f(x) = \int_{0}^{x} t^2 \, dt
$$

- **Verification Criteria**:
  - [ ] The heading remains an intact, single-line bold header.
  - [ ] The intervening text ("Here is the formula...") is NOT swallowed or treated as math.
  - [ ] The math formula renders correctly below.

### Case 2.2: LaTeX Subscripts (`_`) and Multiplication (`*`) Protection
Inline math equation with multiple underscores and asterisks:
$x_1 * y_1 + x_2 * y_2 \le z_{max} * \lambda_{target}$

- **Verification Criteria**:
  - [ ] The text between underscores (`_1 * y_1 + x_2 *`) does NOT become italicized or bolded.
  - [ ] Underscores `_` and asterisks `*` remain intact as part of the formula text.

### Case 2.3: Currency Dollar Signs ($) in Prose
The small widget costs $15 and the deluxe widget costs $45. The total savings is $10 per order.

- **Verification Criteria**:
  - [ ] Dollar amounts (`$15`, `$45`, `$10`) appear as regular text with dollar signs.
  - [ ] Neither amount is treated as an inline LaTeX math formula.

---

## 3. URLs with Balanced Parentheses & Special Characters

### Case 3.1: URLs Containing Parentheses
- Wikipedia English: [Closure in Programming](https://en.wikipedia.org/wiki/Closure_(computer_programming))
- Encoded URL with Parentheses: [Encoded Link](https://example.com/item/(v1.0))
- Multi-nested query link: [Search Link](https://example.com/search?q=(test)&category=(dev))

- **Verification Criteria**:
  - [ ] The trailing closing parenthesis `)` is included inside the hyperlink URL.
  - [ ] The link opens the complete URL without a 404 error.

### Case 3.2: Special HTML Characters in Plain Text & Code
Testing raw angle brackets and ampersands: `5 < 10 && 20 > 15`, `<script>alert('test')</script>`, and `Tom & Jerry`.

- **Verification Criteria**:
  - [ ] `<` and `>` and `&` display literally without causing HTML injection or disappearing.

---

## 4. Complex Nested Inline Styles

### Case 4.1: Multi-layer Inline Formatting
- Underline with nested bold: <u>Underlined text containing **Bold Underlined Text** inside</u>.
- Bold containing inline code: **Important flag: `DISABLE_CACHE=true` must be set**.
- Bold, italic, and strikethrough: ~~***Crucial Deprecated Warning***~~.

- **Verification Criteria**:
  - [ ] All nested styles apply simultaneously without breaking adjacent text.

---

## 5. Horizontal Dividers with Surrounding Spacing

Preceding paragraph before horizontal rule.

---

Succeeding paragraph after horizontal rule.

- **Verification Criteria**:
  - [ ] A clean horizontal divider (`───`) is displayed between the two paragraphs.
  - [ ] There is natural spacing above and below the divider.
