# Slack iOS PoC Phase 4: Tables & Math

This test note is designed for **Phase 4 of the iOS Slack Clipboard PoC**.
Its goal is to verify how the Slack iOS native app handles Markdown tables and LaTeX math formulas via `text/html`.

---

## Verification Instructions for Tester
1. Open this note in **Obsidian Mobile (iOS)**.
2. Run the command **"Format Convert: Copy as Slack Format"**.
3. Paste into the **Slack iOS App** message input box.
4. Check whether table columns align neatly and math formulas are protected in monospace code styling.

---

## 1. Simple Markdown Table
| Item | Status | Priority |
| :--- | :--- | :--- |
| Task A | Done | High |
| Task B | In Progress | Medium |
| Task C | Pending | Low |

## 2. Table with Japanese / CJK Text
| 項目名 | 進捗 | 担当者 |
| :--- | :--- | :--- |
| 要件定義 | 完了 | 鈴木 |
| 設計レビュー | 進行中 | 佐藤 |
| リリース | 未着手 | 田中 |

## 3. Inline Math
This is an inline formula: $E = mc^2$ within a sentence.

## 4. Display Math (Block)
$$
f(x) = \int_{-\infty}^{\infty} \hat{f}(\xi)\,e^{2 \pi i \xi x}\,d\xi
$$
