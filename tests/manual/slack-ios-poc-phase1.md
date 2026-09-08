# Slack iOS PoC Phase 1: Inline Formatting & Links

This test note is designed for **Phase 1 of the iOS Slack Clipboard PoC**.
Its goal is to verify whether the Slack iOS native app correctly parses and renders basic rich-text HTML elements (`text/html`) copied from Obsidian on iOS.

---

## Verification Instructions for Tester
1. Open this note in **Obsidian Mobile (iOS)**.
2. Run the command **"Format Convert: Copy as Slack Format"** (or use the ribbon / file menu).
3. Switch to the **Slack iOS App** and paste into any message input box (or your personal DM / scratch channel).
4. Check whether each section below renders as rich text in Slack.

---

## 1. Bold
- **Asterisks**: **This text should be bold**
- **Underscores**: __This text should also be bold__

## 2. Italic
- *Asterisks*: *This text should be italic*
- _Underscores_: _This text should also be italic_

## 3. Strikethrough
- ~~Strikethrough~~: ~~This text should have a line through it~~

## 4. Underline
- <u>Underline</u>: <u>This text should be underlined</u>

## 5. Inline Code
- `Inline Code`: `const message = "Hello from iOS";`

## 6. Hyperlink
- Hyperlink: [Google Search](https://www.google.com)
- Safe Markdown Link: [Obsidian Official](https://obsidian.md)

## 7. Combined Formatting
- Bold + Inline Code: **Important config: `DEBUG=true`**
- Bold + Italic: ***Bold and Italic combined***
- Bold + Strikethrough: ~~**Bold Strikethrough**~~
- Underline + Bold: <u>**Underlined Bold**</u>

## 8. Paragraphs & Line Breaks
First line of the first paragraph.
Second line of the first paragraph (soft line break).

New paragraph after an empty line (should appear as a separate paragraph).
