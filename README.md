# Format Convert Copy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-46%20passed-brightgreen.svg)]()
[![Obsidian](https://img.shields.io/badge/Obsidian-Desktop%20%26%20Mobile-7C3AED.svg)](https://obsidian.md)

**Format Convert Copy** is a lightning-fast Obsidian plugin that converts selected Markdown text or active notes into **Slack**, **Discord**, and **WhatsApp** formats—or copies clean raw Markdown—with a single tap or shortcut.

Designed from the ground up for seamless cross-platform usage across **Desktop (macOS, Windows, Linux)** and **Mobile (iOS, Android)**.

[English Guide](#features) | [日本語ドキュメント](#日本語ガイド)

---

## Features

- 🚀 **One-Tap Multi-Platform Copy**:
  - **Slack**: Generates rich text HTML for desktop Slack with clean mrkdwn fallback (`*bold*`, `_italic_`, `~strike~`, `<url|text>`, blockquotes, nested lists).
  - **Discord**: Full Discord Markdown conversion (`**bold**`, `*italic*`, `__underline__`, `~~strike~~`, code fences).
  - **WhatsApp**: WhatsApp-specific formatting (`*bold*`, `_italic_`, `~strike~`, expanded link syntax).
  - **Raw Markdown**: Cleanly copy active note or selection without formatting modifications.
- 📱 **Built for Mobile Ergonomics (iOS & Android)**:
  - **Mobile Navigation Bar**: Direct copy buttons or full format selection menu.
  - **Mobile Keyboard Toolbar**: Distinct, recognizable icons (`share-2`, `message-square`, `message-circle`, `file-text`, `copy`) for one-tap toolbar access.
  - **File Explorer Long-Press**: Convert entire notes directly from file lists without opening them.
- 📐 **Automatic Markdown Table Formatting**:
  - Automatically aligns columns and formats Markdown tables into monospace code blocks (` ``` ` / `<pre><code>`) so tables never misalign in chat apps.
  - Full support for CJK (Japanese, Chinese, Korean) double-width character alignment.
- 🧮 **LaTeX / MathJax Protection**:
  - Inline math (`$...$`) and block math (`$$...$$`) are protected against accidental formatting (prevents subscripts `_` and asterisks `*` from corrupting formulas).
- 🖼️ **Embed & Attachment Normalization**:
  - Wikilink embeds (`![[screenshot.png|300]]`, `![[document.pdf]]`) are cleanly converted to readable placeholders (`[image: screenshot.png]`, `[attachment: document.pdf]`).
- 🔒 **Security First (URL Scheme Sanitization)**:
  - Validates URL schemes in links, blocking dangerous protocols like `javascript:` and `data:`.
- 🔕 **Customizable Notification (Silent Mode)**:
  - Option to suppress success Notice toasts for uninterrupted high-frequency copying.
- 🎯 **Smart Empty Selection**:
  - Configurable behavior when no text is selected: copy the **entire note** or just the **current cursor line**.

---

## Syntax Conversion Comparison

| Obsidian Syntax | Slack (mrkdwn / HTML) | Discord | WhatsApp |
| :--- | :--- | :--- | :--- |
| `**Bold**` | `*Bold*` / `<b>Bold</b>` | `**Bold**` | `*Bold*` |
| `*Italic*` | `_Italic_` / `<i>Italic</i>` | `*Italic*` | `_Italic_` |
| `~~Strikethrough~~` | `~Strikethrough~` / `<s>...</s>` | `~~Strikethrough~~` | `~Strikethrough~` |
| `<u>Underline</u>` | Plain text / `<u>Underline</u>` | `__Underline__` | Plain text |
| `- [ ] Task` | `☐ Task` | `☐ Task` | `☐ Task` |
| `- [x] Done` | `☑ Done` | `☑ ~~Done~~` | `☑ Done` |
| `> [!NOTE] Callout` | `> *[NOTE]*` / `<blockquote>` | `> **[NOTE]**` | `> *[NOTE]*` |
| `[Title](url)` | `<url\|Title>` / `<a href="...">` | `[Title](url)` | `Title (url)` |
| `[[Note\|Alias]]` | `Alias` | `Alias` | `Alias` |
| `![[image.png\|300]]` | `[image: image.png]` | `[image: image.png]` | `[image: image.png]` |
| `$$E = mc^2$$` | Protected code block | Protected code block | Protected code block |
| `$x_1 * y_1$` | Protected inline code | Protected inline code | Protected inline code |
| Markdown Tables | Monospace code block | Monospace code block | Monospace code block |

---

## How to Use

### 1. Navigation Bar / Ribbon Icons
Click or tap the ribbon icon (left ribbon on desktop, navigation bar on mobile) to immediately convert and copy:
- Individual direct buttons (Slack, Discord, WhatsApp, Markdown) can be enabled in Settings.
- Or use the **Format Selection Menu** (`copy` icon) to select from a popup menu.

### 2. Mobile Keyboard Toolbar (iOS / Android)
Add Format Convert Copy commands to your Obsidian Mobile Toolbar under **Settings > Mobile > Manage toolbar options**:
- Each command has a distinct icon so they are easily recognizable above the keyboard.

### 3. File Explorer Menu (Long-Press / Right-Click)
In the file tree, right-click (desktop) or long-press (mobile) any Markdown note to copy its contents in your preferred format.

### 4. Command Palette & Hotkeys
Open the Command Palette (`Ctrl/Cmd + P`) and search for:
- `Format Convert Copy: Slack形式に変換してコピー`
- `Format Convert Copy: Discord形式に変換してコピー`
- `Format Convert Copy: WhatsApp形式に変換してコピー`
- `Format Convert Copy: Markdownのままコピー`
- `Format Convert Copy: 形式を選択してコピー（メニュー表示）`

---

## Installation

### Via Obsidian Community Plugins (Coming Soon)
1. Open **Settings > Community plugins** in Obsidian.
2. Search for **Format Convert Copy**.
3. Click **Install**, then **Enable**.

### Via BRAT (Beta Testing)
1. Install the [Obsidian42 - BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
2. Go to **Settings > BRAT > Add Beta plugin**.
3. Enter `shallow1992/obsidian-format-convert-copy`.
4. BRAT will automatically download the latest release and keep it updated.

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the [Latest Release](https://github.com/shallow1992/obsidian-format-convert-copy/releases).
2. Create a folder named `format-convert-copy` in your vault's `.obsidian/plugins/` directory:
   `<Vault>/.obsidian/plugins/format-convert-copy/`
3. Copy the downloaded files into that folder.
4. Reload Obsidian and enable **Format Convert Copy** under **Settings > Community plugins**.

---

## 日本語ガイド

### 概要
**Format Convert Copy** は、Obsidianで作成したMarkdownノートや選択テキストを、**Slack・Discord・WhatsApp** の各チャットアプリに最適化された記法（または純粋なMarkdown）にワンタップで変換してクリップボードにコピーするプラグインです。

### 主な特徴
- **Slack・Discord・WhatsApp・Markdown** の4形式に対応
- **モバイル（iOS / Android）完全対応**: ナビゲーションバー、キーボード上部のモバイルツールバー、ファイル一覧の長押しメニューから快適に利用可能
- **Markdown表（テーブル）の自動等幅化**: チャットアプリで崩れやすい表構文を等幅フォントのコードブロックに自動整形（日本語全角文字の幅も正確に考慮）
- **数式（LaTeX / MathJax）の保護**: `$E=mc^2$` や `$$...$$` のアンダースコアやアスタリスクが斜体・太字に誤変換されるのを防止
- **画像・添付ファイル記法対応**: `![[image.png|300]]` などのObsidian独自記法を `[image: image.png]` などの読みやすいテキストに置換
- **URLスキームの安全検証**: `javascript:` 等の危険なURLスキームを自動サニタイズ
- **未選択時の動作設定**: テキスト未選択時に「ノート全文」または「カーソル行（現在の1行）」のどちらをコピーするか選択可能
- **サイレントモード**: 完了トースト通知（Notice）を非表示にして連続作業を快適に

---

## Development

All build and test tasks are containerized via Docker to guarantee a clean, reproducible environment:

```bash
# Run unit tests (Vitest)
docker compose run --rm format-convert npm test

# Build production bundle
docker compose run --rm format-convert npm run build

# Watch mode
docker compose run --rm format-convert npm run dev
```

---

## License

This project is licensed under the [MIT License](./LICENSE).
