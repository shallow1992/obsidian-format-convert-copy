# Comprehensive Manual Test Suite: WhatsApp Format

This note contains a complete collection of Markdown syntaxes and edge cases for manually testing the **Format Convert: Copy as WhatsApp Format** feature.

Testers may copy the contents of this file or place this note anywhere in their Obsidian vault.

---

# Heading 1 (Must convert to *Heading 1* bold)
## Heading 2 (Must convert to *Heading 2* bold)
### Heading 3 (Must convert to *Heading 3* bold)

---

## 1. Inline Formatting (WhatsApp Formatting Parity)
- **Bold**: **Double asterisk bold** (must convert to single asterisk `*Bold*` for WhatsApp)
- *Italic*: *Asterisk italic* or _Underscore italic_ (must convert to single underscore `_Italic_`)
- ~~Strikethrough~~: ~~Double tilde strike~~ (must convert to single tilde `~Strike~` for WhatsApp)
- <u>Underline</u>: <u>Underlined HTML text</u> (must strip HTML underline tags because WhatsApp does not support underline)
- `Inline Code`: `const code = "wa_123";` (must remain single backtick inline code)
- Hyperlink: [Official WhatsApp Site](https://www.whatsapp.com) (must expand to `Official WhatsApp Site (https://www.whatsapp.com)`)
- Underscore in URL: [API Documentation](https://example.com/api_v1_endpoint) (must preserve underscores in URL)
- Plain URL: https://example.com/webhook_event_trigger (must remain clickable with intact underscores)
- Snake_case Text: `order_id_code` or unquoted user_account_id (intra-word underscores must not italicize)

---

## 2. Lists & Hierarchy
- Level 1 Bullet Item A
  - Level 2 Nested Item B
    - Level 3 Nested Item C
1. Step 1 (Numbered List)
   1. Substep 1-1
   2. Substep 1-2
2. Step 2

---

## 3. Checklists / Task Lists
- [ ] Incomplete task item (must render as `☐ Incomplete task item`)
- [x] Completed task item (must render as `☑ Completed task item`)
- [ ] Task with **bold** and `code`

---

## 4. Blockquotes & Obsidian Callouts
> Standard quote in WhatsApp.

> [!NOTE] Release Update
> Obsidian Callout syntax with title.
> Must convert to `> *[NOTE]* Release Update` followed by content.

> [!WARNING]
> Warning callout without title.
> Must convert to `> *[WARNING]*`.

---

## 5. Code Blocks
```python
def format_phone(number: str) -> str:
    """Formats phone number for WhatsApp international standard."""
    return f"+{number.strip('+')}"

print(format_phone("+819012345678"))
```

```
Plain code block without language tag.
Must preserve indentation and line breaks.
```

---

## 6. Tables (Monospace Aligned Code Block Protection)
| Product | Category | Price | Status |
| :--- | :--- | ---: | :---: |
| Espresso Roast | Coffee Beans | $18.00 | Available |
| Matcha Powder | Tea | $24.50 | In Stock |
| Cold Brew Mug | Drinkware | $15.00 | Out of Stock |

---

## 7. Math & Vault-Specific Wikilinks
- Inline Math: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ (must be protected inside code blocks)
- Block Math:
$$
A = \pi r^2
$$
- Obsidian Internal Link (Wikilinks): [[Meeting Notes|Team Standup]] (must extract alias `Team Standup`)
- Embedded Attachment: ![[receipt.pdf]] (must convert to `[attachment: receipt.pdf]`)
