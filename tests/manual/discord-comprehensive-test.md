# Comprehensive Manual Test Suite: Discord Format

This note contains a complete collection of Markdown syntaxes and edge cases for manually testing the **Format Convert: Copy as Discord Format** feature.

Testers may copy the contents of this file or place this note anywhere in their Obsidian vault.

---

# Heading 1 (H1: Discord native large heading `# `)
## Heading 2 (H2: Discord native medium heading `## `)
### Heading 3 (H3: Discord native small heading `### `)
#### Heading 4 (H4: Fallback to bold subheader)
##### Heading 5 (H5: Fallback to bold subheader)
###### Heading 6 (H6: Fallback to bold subheader)

---

## 1. Inline Formatting (Discord Markdown Parity)
- **Bold**: **Bold text with asterisks** (and __bold text with underscores__, which must convert to asterisks `**text**` so Discord does not misinterpret it as underline)
- *Italic*: *Italic text with asterisk* (or _italic with underscore_)
- <u>Underline</u>: <u>Underlined HTML text</u> (must convert to Discord native `__text__`)
- ~~Strikethrough~~: ~~Deprecated information~~ (must remain `~~text~~`)
- `Inline Code`: `const token = "discord_test_123";`
- Discord Spoiler: ||Hidden secret text||
- Hyperlink: [Discord Developer Portal](https://discord.com/developers)
- **Combined Formatting**: **Bold with `inline code`**, or ***Bold Italic***, or <u>**Bold Underline**</u>, or ~~**Bold Strikethrough**~~

---

## 2. Bulleted Lists (Multi-Level & Indent Patterns)

### Pattern A: 2-Space Indentation (5-Level Nesting)
- Level 1 Bullet Item A
  - Level 2 Nested Item (Indent: 2 spaces)
    - Level 3 Nested Item (Indent: 4 spaces)
      - Level 4 Nested Item (Indent: 6 spaces)
        - Level 5 Nested Item (Indent: 8 spaces)
- Level 1 Bullet Item B

### Pattern B: 4-Space Indentation (Standard Obsidian / CommonMark)
- Level 1 Bullet Item A
    - Level 2 Nested Item (Indent: 4 spaces)
        - Level 3 Nested Item (Indent: 8 spaces)
            - Level 4 Nested Item (Indent: 12 spaces)
                - Level 5 Nested Item (Indent: 16 spaces)
- Level 1 Bullet Item B

### Pattern C: Tab Indentation (Obsidian "Use Tabs" Setting)
- Level 1 Bullet Item A
	- Level 2 Nested Item (Indent: 1 tab)
		- Level 3 Nested Item (Indent: 2 tabs)
			- Level 4 Nested Item (Indent: 3 tabs)
				- Level 5 Nested Item (Indent: 4 tabs)
- Level 1 Bullet Item B

### Pattern D: Deep Nesting Test (10-Level Nesting in Discord)
- Level 1 Root Item
  - Level 2 Nested
    - Level 3 Nested
      - Level 4 Nested
        - Level 5 Nested
          - Level 6 Nested
            - Level 7 Nested
              - Level 8 Nested
                - Level 9 Nested
                  - Level 10 Deepest Item

---

## 3. Numbered Lists (5-Level Nesting & Return to Root)

### Pattern A: 2-Space Indentation
1. Step 1 (Level 1)
   1. Step 1-1 (Level 2)
      1. Step 1-1-1 (Level 3)
         1. Step 1-1-1-1 (Level 4)
            1. Step 1-1-1-1-1 (Level 5)
2. Step 2 (Level 1: returns to root)

### Pattern B: 4-Space Indentation
1. Step 1 (Level 1)
    1. Step 1-1 (Level 2)
        1. Step 1-1-1 (Level 3)
            1. Step 1-1-1-1 (Level 4)
                1. Step 1-1-1-1-1 (Level 5)
2. Step 2 (Level 1: returns to root)

### Pattern C: Tab Indentation
1. Step 1 (Level 1)
	1. Step 1-1 (Level 2)
		1. Step 1-1-1 (Level 3)
			1. Step 1-1-1-1 (Level 4)
				1. Step 1-1-1-1-1 (Level 5)
2. Step 2 (Level 1: returns to root)

---

## 4. Checklists / Task Lists (Discord Strikethrough Conversion)

### Pattern A: 2-Space Indentation
- [ ] Incomplete task item (must render as `☐ Incomplete task item`)
  - [x] Completed task item (must render with strikethrough as `☑ ~~Completed task item~~`)
    - [ ] Detailed subtask A (Level 3)
      - [x] Completed subtask B (Level 4)
        - [ ] Deepest task item (Level 5)
- [x] Parent completed task item

### Pattern B: 4-Space Indentation
- [ ] Incomplete task item
    - [x] Completed task item
        - [ ] Detailed subtask A
            - [x] Completed subtask B
                - [ ] Deepest task item
- [x] Parent completed task item

### Pattern C: Tab Indentation
- [ ] Incomplete task item
	- [x] Completed task item
		- [ ] Detailed subtask A
			- [x] Completed subtask B
				- [ ] Deepest task item
- [x] Parent completed task item

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
> Standard single-line quote in Discord.

> Multi-line quote in Discord.
> Preserving formatting like **bold**, `code`, and [links](https://discord.com).

> [!NOTE] Announcement
> Obsidian Callout with custom title.
> Converts to bold-titled blockquote: `> **[Announcement]**`.

> [!WARNING]
> Obsidian Callout without title.
> Converts to type fallback: `> **[WARNING]**`.

---

## 7. Code Blocks
```typescript
interface DiscordMessage {
    content: string;
    embeds?: object[];
}

function sendAlert(msg: DiscordMessage): void {
    console.log(`Sending to Discord: ${msg.content}`);
}
```

```
Plain code block without language identifier.
Indents and brackets must remain intact.
```

---

## 8. Tables (Monospace Aligned Code Block Protection)

### Pattern A: Standard ASCII Table
| Command | Description | Permission | Notes |
| :--- | :--- | :---: | ---: |
| `/ban` | Ban user permanently | Admin | Logs to channel |
| `/mute` | Mute member | Moderator | Timed duration |
| `/help` | Display commands | Everyone | Ephemeral reply |

### Pattern B: Japanese / CJK Font Alignment Test
| 項目名 | 進捗状況 | 優先度 |
| :--- | :--- | :--- |
| 基本設計 | 完了 | 高 |
| 詳細設計 | 進行中 | 中 |
| 結合テスト | 未着手 | 低 |

---

## 9. Math & Vault-Specific Wikilinks (Code Protection)
- Inline Math: $E = mc^2$ (must be protected in monospace code)
- Formula with Subscripts & Asterisks: $x_1 * y_1 + x_2 * y_2 \le z_{max} * \lambda_{target}$
- Block Math:
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
- Currency Dollar Signs (Must NOT convert to math): The item costs $15 and the premium version costs $45.
- Obsidian Internal Link (Wikilinks): [[Server Rules|Community Guidelines]] (must extract alias `Community Guidelines`)
- Embedded Attachment: ![[server-badge.png]] (must convert to `[image: server-badge.png]`)
