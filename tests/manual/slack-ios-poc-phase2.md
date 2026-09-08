# Slack iOS PoC Phase 2: Lists, Nesting Depth & Quotes

This test note is designed for **Phase 2 of the iOS Slack Clipboard PoC**.
Its goal is to verify how the Slack iOS native app renders multi-level nested lists, numbered lists, task checklists, blockquotes, and callouts via `text/html`.

---

## Verification Instructions for Tester
1. Open this note in **Obsidian Mobile (iOS)**.
2. Run the command **"Format Convert: Copy as Slack Format"**.
3. Paste into the **Slack iOS App** message input box.
4. Check whether nesting indentation, numbering, quotes, and checkboxes render cleanly.

---

## 1. Multi-Level Bullet Lists (1 to 5 Levels)
- Level 1 Bullet Item A
  - Level 2 Nested Item (Indent 1)
    - Level 3 Nested Item (Indent 2)
      - Level 4 Nested Item (Indent 3)
        - Level 5 Nested Item (Indent 4: Deepest Level)
- Level 1 Bullet Item B

## 2. Multi-Level Numbered Lists (1 to 5 Levels)
1. Step 1 (Root Level)
   1. Step 1.1 (Level 2)
      1. Step 1.1.1 (Level 3)
         1. Step 1.1.1.1 (Level 4)
            1. Step 1.1.1.1.1 (Level 5)
2. Step 2 (Return to Root Level)

## 3. Checklists / Task Lists
- [ ] Incomplete task item
- [x] Completed task item (should have strikethrough)
  - [ ] Nested incomplete subtask
  - [x] Nested completed subtask

## 4. Mixed Lists (Numbered + Bullet + Task)
1. Project Kickoff
   - Gather requirements
     - [x] Interview stakeholders
     - [ ] Write specifications
2. Implementation Phase
   - [ ] Core converter development

## 5. Blockquotes & Callouts
> This is a standard single-line blockquote.

> This is a multi-line blockquote.
> It should contain **bold text**, `inline code`, and [links](https://obsidian.md).
> All formatted lines should stay within the quote container.

> [!NOTE] Release Update
> This is an Obsidian callout block.
> In Slack, this should render as a quote container with a bold header.

> [!WARNING] Important Notice
> Please verify that the warning header is prominent.
