# Comprehensive Manual Test Suite: Discord Format

This note contains a complete collection of Markdown syntaxes and edge cases for manually testing the **Format Convert: Copy as Discord Format** feature.

Testers may copy the contents of this file or place this note anywhere in their Obsidian vault.

---

# Heading 1 (H1: Discord native large heading)
## Heading 2 (H2: Discord native medium heading)
### Heading 3 (H3: Discord native small heading)

---

## 1. Inline Formatting (Discord Markdown Parity)
- **Bold**: **Bold text with asterisks** (and __bold text with underscores__, which must convert to asterisks `**text**` so Discord does not misinterpret it as underline)
- *Italic*: *Italic text with asterisk* (or _italic with underscore_)
- <u>Underline</u>: <u>Underlined HTML text</u> (must convert to Discord native `__text__`)
- ~~Strikethrough~~: ~~Deprecated information~~ (must remain `~~text~~`)
- `Inline Code`: `const token = "discord_test_123";`
- Discord Spoiler: ||Hidden secret text||
- Hyperlink: [Discord Developer Portal](https://discord.com/developers)
- **Combined Formatting**: **Bold with `inline code`**, or ***Bold Italic***, or <u>**Bold Underline**</u>

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

## 3. Checklists / Task Lists (Discord Strikethrough Conversion)
- [ ] Incomplete task item (must render as `☐ Incomplete task item`)
- [x] Completed task item (must render with strikethrough as `☑ ~~Completed task item~~`)
- [ ] Task with **bold** and `code`

---

## 4. Blockquotes & Obsidian Callouts
> Standard single-line quote in Discord.

> Multi-line quote in Discord.
> Preserving formatting like **bold** and `code`.

> [!NOTE] Announcement
> Obsidian Callout syntax.
> Must convert to `> **[NOTE]** Announcement` or bold-titled blockquote.

> [!WARNING] Caution
> Warning callout verification.

---

## 5. Code Blocks
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

## 6. Tables (Monospace Aligned Code Block Protection)
| Command | Description | Permission | Notes |
| :--- | :--- | :---: | ---: |
| `/ban` | Ban user permanently | Admin | Logs to channel |
| `/mute` | Mute member | Moderator | Timed duration |
| `/help` | Display commands | Everyone | Ephemeral reply |

---

## 7. Math & Vault-Specific Wikilinks
- Inline Math: $E = mc^2$ (must be protected in monospace code)
- Block Math:
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
- Obsidian Internal Link (Wikilinks): [[Server Rules|Community Guidelines]] (must extract alias `Community Guidelines`)
- Embedded Attachment: ![[server-badge.png]] (must convert to `[image: server-badge.png]`)
