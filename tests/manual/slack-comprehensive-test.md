# Comprehensive Manual Test Suite: Slack Native Format

This note contains a complete collection of Markdown syntaxes and edge cases for manually testing the **Format Convert: Copy as Slack Format** feature.

Testers may copy the contents of this file or place this note anywhere in their Obsidian vault.

---

# Heading 1 (H1: Largest Header)
## Heading 2 (H2)
### Heading 3 (H3)
#### Heading 4 (H4)
##### Heading 5 (H5)
###### Heading 6 (H6: Smallest Header)

---

## 1. Inline Formatting (Slack Toolbar Parity)
- **Bold**: **Bold Text** (or __Underscore Bold__)
- *Italic*: *Italic Text* (or _Underscore Italic_)
- <u>Underline</u>: <u>Underlined Text</u>
- ~~Strikethrough~~: ~~Deprecated Information~~
- `Inline Code`: `const token = "slack_test_123";`
- Hyperlink: [Google Search](https://www.google.com)
- **Combined Formatting**: **Bold text containing `inline code`**, or ***Bold Italic***, or ~~**Bold Strikethrough**~~

---

## 2. Bulleted Lists (5-Level Nesting)
- Level 1 Bullet Item A
  - Level 2 Nested Item (Indent 1)
    - Level 3 Nested Item (Indent 2)
      - Level 4 Nested Item (Indent 3)
        - Level 5 Nested Item (Indent 4: Deepest Supported Level)
- Level 1 Bullet Item B

---

## 3. Numbered Lists (5-Level Nesting & Return to Root)
1. Step 1 (Level 1: rendered as `1.`)
   1. Step 1-1 (Level 2: rendered as `a.`)
      1. Step 1-1-1 (Level 3: rendered as `i.`)
         1. Step 1-1-1-1 (Level 4: rendered as `1.`)
            1. Step 1-1-1-1-1 (Level 5: rendered as `a.`)
2. Step 2 (Level 1: returns to `2.`)

---

## 4. Checklists / Task Lists (5-Level Nesting)
- [ ] Incomplete Task (Level 1)
  - [x] Completed Task (Level 2)
    - [ ] Detailed Subtask A (Level 3)
      - [x] Completed Subtask B (Level 4)
        - [ ] Deepest Task (Level 5)
- [x] Parent Completed Task (Level 1)

---

## 5. Mixed Nested Lists
1. Project Planning Phase (Numbered Level 1)
   - Requirements Definition (Bullet Level 2)
     - [ ] Create API Specifications (Incomplete Checklist Level 3)
     - [x] Design Database Schema (Completed Checklist Level 3)
       1. Finalize Foreign Key Constraints (Numbered Level 4)
          - [x] Security Review Approval (Checklist Level 5)
2. Implementation Phase (Numbered Level 1)

---

## 6. Blockquotes & Obsidian Callouts
> This is a standard single-line blockquote.

> This is a multi-line blockquote.
> Inside quotes, **bold**, `inline code`, and [links](https://example.com) must function properly.

> [!NOTE] Release Announcement
> This is an Obsidian callout block.
> In Slack, this renders as a bold-titled quote container.

> [!WARNING] Deprecation Alert
> Warning callout verification.

---

## 7. Code Blocks
```typescript
function calculateTotal(items: { price: number; count: number }[]): number {
    return items.reduce((sum, item) => sum + item.price * item.count, 0);
}

// Verification
const total = calculateTotal([{ price: 100, count: 2 }]);
console.log(`Total: $${total}`);
```

```
Plain code block without language tag.
Indentation and symbols must remain intact.
```

---

## 8. Tables (Monospace Aligned Code Block)

### Pattern A: Standard ASCII Table with Column Alignments
| Item Name (Left) | Status (Center) | Quantity (Right) | Price (Right) | Notes (Left) |
| :--- | :---: | ---: | ---: | :--- |
| Apple Fuji | Available | 12 | $12.00 | Fresh harvest |
| Mandarin Orange | In Stock | 150 | $85.00 | Sweet seedless |
| Shine Muscat | Sold Out | 3 | $120.00 | Premium gift box |
| Banana Cavendish | Available | 50 | $9.80 | High altitude grown |

### Pattern B: Mixed CJK Multi-byte Characters & Inline Code
| Feature | Syntax | Alignment | Slack Native Support |
| :--- | :--- | :---: | ---: |
| Heading | `# Heading` | Left | Bold text |
| Bold | `**Bold**` | Left | Bold attribute |
| Checkbox | `- [x]` | Center | ☑ Checked bullet |
| Long cell test | `Some very long inline code parameter inside cell` | Right | Monospace code block |

---

## 9. Math & Vault-Specific Wikilinks
- Inline Math: $E = mc^2$
- Block Math:
$$
\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
- Obsidian Internal Link (Wikilinks): [[Project Documentation|System Architecture]]
- Embedded Attachment: ![[architecture-diagram.png]]

---

## 10. Edge Cases (Spacing, Math Collisions & URLs)

### 10.1 Consecutive Empty Lines
Paragraph A

Paragraph B (separated by 1 empty line)


Paragraph C (separated by 2 empty lines)

### 10.2 Blockquote Separation
> First independent quote block.

> Second independent quote block.

### 10.3 Prose Math Delimiters & Parentheses in URLs
- Formula with subscripts: $a_1 * b_1 + a_2 * b_2$
- Balanced URL: [Closure](https://en.wikipedia.org/wiki/Closure_(computer_programming))

