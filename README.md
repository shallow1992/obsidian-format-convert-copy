# Format Convert Copy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build & Test](https://github.com/shallow1992/obsidian-format-convert-copy/actions/workflows/build-test.yml/badge.svg)](https://github.com/shallow1992/obsidian-format-convert-copy/actions/workflows/build-test.yml)
[![Latest Release](https://img.shields.io/github/v/release/shallow1992/obsidian-format-convert-copy)](https://github.com/shallow1992/obsidian-format-convert-copy/releases/latest)
[![Obsidian](https://img.shields.io/badge/Obsidian-Desktop%20%26%20Mobile-7C3AED.svg)](https://obsidian.md)

**Format Convert Copy** is a lightning-fast Obsidian plugin that converts selected Markdown text or active notes into **Slack**, **Discord**, and **WhatsApp** formats—or copies clean raw Markdown—with a single tap or shortcut.

Designed from the ground up for seamless cross-platform usage across **Desktop (macOS, Windows, Linux)** and **Mobile (iOS, Android)**.

[English Guide](#features) | [日本語ドキュメント](#日本語ガイド)

---

## Features

- 🌐 **Multilingual Support (i18n)**: Automatically detects Obsidian's UI language to provide a native interface in English (default) and Japanese.
- 🚀 **One-Tap Multi-Platform Copy**:
  - **Slack**: Synthesizes Slack's internal Quill Delta format (`slack/texty`) on Desktop for native code blocks, 5-level nested lists, blockquotes, and formatting, with clean mrkdwn fallback for mobile.
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
- 🔔 **Customizable Notification**:
  - Toggle copy success toast notifications on or off for seamless, uninterrupted workflows. Error notifications will always be displayed.
- 🎯 **Smart Empty Selection**:
  - Configurable behavior when no text is selected: copy the **entire note** or just the **current cursor line**.

---

## Syntax Conversion Comparison

| Obsidian Syntax | Slack (Desktop: texty / Mobile: HTML) | Discord | WhatsApp |
| :--- | :--- | :--- | :--- |
| `**Bold**` / `__Bold__` | `*Bold*` / `<b>Bold</b>` | `**Bold**` | `*Bold*` |
| `*Italic*` / `_Italic_` | `_Italic_` / `<i>Italic</i>` | `*Italic*` | `_Italic_` |
| `~~Strikethrough~~` | `~Strikethrough~` / `<s>...</s>` | `~~Strikethrough~~` | `~Strikethrough~` |
| `<u>Underline</u>` | Plain text / `<u>Underline</u>` | `__Underline__` (native underline) | Plain text (stripped) |
| `# Heading` | `*Heading*` / `<b>Heading</b>` | `#..### Heading` (preserved) / `####..######` (bold fallback) | `*Heading*` (bold fallback) |
| `1. Numbered List` | `1. Item` (5-level nested list) | `1. Item` | `1. Item` |
| `- Bullet` / `* Bullet` | `• Bullet` / `<ul><li>` (5-level nested list) | `- Bullet` (deep nesting supported) | `- Bullet` (single level) |
| `- [ ] Task` | `☐ Task` | `☐ Task` | `☐ Task` |
| `- [x] Done` | `☑ Done` | `☑ ~~Done~~` (strikethrough) | `☑ Done` |
| `` `Inline Code` `` | `` `code` `` / `<code>code</code>` | `` `code` `` | `` `code` `` |
| ```` ```Code Block``` ```` | Native block (Desktop) / `<pre><code>` (Mobile) | Native code block (```` ``` ````) | Monospace block (```` ``` ````) |
| `> Quote` | Native quote (Desktop) / `<blockquote>` (Mobile) | `> Quote` (native quote) | `> Quote` (native quote) |
| `> [!NOTE] Callout` | Bold-titled quote (Desktop) / `<blockquote><b>` (Mobile) | `> **[NOTE]**` (or `> **[Title]**`) | `> *[NOTE]*` (or `> *[Title]*`) |
| `[Title](url)` | `<url\|Title>` / `<a href="...">` | `[Title](url)` | `Title (url)` (auto-expanded) |
| `[[Note\|Alias]]` | `Alias` | `Alias` | `Alias` |
| `![[image.png\|300]]` | `[image: image.png]` | `[image: image.png]` | `[image: image.png]` |
| `![[audio.mp3]]` | `[media: audio.mp3]` | `[media: audio.mp3]` | `[media: audio.mp3]` |
| `![[file.pdf]]` | `[attachment: file.pdf]` | `[attachment: file.pdf]` | `[attachment: file.pdf]` |
| `$$E = mc^2$$` | Protected code block | Protected code block | Protected code block |
| `$x_1 * y_1$` | Protected inline code | Protected inline code | Protected inline code |
| Markdown Tables | Monospace code block (auto-aligned)| Monospace code block (auto-aligned)| Monospace code block (auto-aligned)|

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
- `Format Convert Copy: Convert and copy for Slack` (Japanese: `Slack形式に変換してコピー`)
- `Format Convert Copy: Convert and copy for Discord` (Japanese: `Discord形式に変換してコピー`)
- `Format Convert Copy: Convert and copy for WhatsApp` (Japanese: `WhatsApp形式に変換してコピー`)
- `Format Convert Copy: Copy as raw Markdown` (Japanese: `Markdown形式でコピー`)
- `Format Convert Copy: Choose format and copy (Show menu)` (Japanese: `形式を選択してコピー`)

---

## Installation

### Via Obsidian Community Plugins
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
2. Create a folder named `format-convert-copy` in your vault's plugin directory:
   `your-vault/.obsidian/plugins/format-convert-copy/`
3. Copy the downloaded files into that folder.
4. Reload Obsidian and enable **Format Convert Copy** under **Settings > Community plugins**.

---

## 日本語ガイド

### 概要
**Format Convert Copy** は、Obsidianで作成したMarkdownノートや選択テキストを、**Slack・Discord・WhatsApp** の各チャットアプリに最適化された記法（または純粋なMarkdown）にワンタップで変換してクリップボードにコピーするプラグインです。

### 主な特徴
- **Slack・Discord・WhatsApp・Markdown** の4形式に対応
- **多言語対応（i18n）**: Obsidianの言語設定に合わせて英語と日本語をシームレスに自動切り替え
- **モバイル（iOS / Android）完全対応**: ナビゲーションバー、キーボード上部のモバイルツールバー、ファイル一覧の長押しメニューから快適に利用可能
- **Markdown表（テーブル）の自動等幅化**: チャットアプリで崩れやすい表構文を等幅フォントのコードブロックに自動整形（日本語全角文字の幅も正確に考慮）
- **数式（LaTeX / MathJax）の保護**: `$E=mc^2$` や `$$...$$` のアンダースコアやアスタリスクが斜体・太字に誤変換されるのを防止
- **画像・添付ファイル記法対応**: `![[image.png|300]]` などのObsidian独自記法を `[image: image.png]` などの読みやすいテキストに置換
- **URLスキームの安全検証**: `javascript:` 等の危険なURLスキームを自動サニタイズ
- **未選択時の動作設定**: テキスト未選択時に「ノート全文」または「カーソル行（現在の1行）」のどちらをコピーするか選択可能
- **サイレントモード**: 完了トースト通知（Notice）を非表示にして連続作業を快適に

### 各形式の変換対応表

ObsidianのMarkdown記法が、コピー時に各アプリ向けにどのように変換されるかの一覧です。

| 記法・要素 | Obsidian (元の記法) | Slack形式 (PC: texty / モバイル: HTML) | Discord形式 | WhatsApp形式 |
| :--- | :--- | :--- | :--- | :--- |
| **太字** | `**テキスト**` / `__テキスト__` | `*テキスト*` / `<b>テキスト</b>` | `**テキスト**` | `*テキスト*` |
| **斜体** | `*テキスト*` / `_テキスト_` | `_テキスト_` / `<i>テキスト</i>` | `*テキスト*` | `_テキスト_` |
| **打消し線** | `~~テキスト~~` | `~テキスト~` / `<s>テキスト</s>` | `~~テキスト~~` | `~テキスト~` |
| **下線** | `<u>テキスト</u>` | 通常テキスト / `<u>テキスト</u>` | `__テキスト__`（Discord下線） | 通常テキスト（タグ除去） |
| **見出し** | `# 見出し` | `*見出し*`（太字化） / `<b>` | `#..### 見出し`（維持） / `####..######`（太字化） | `*見出し*`（太字化） |
| **番号付きリスト** | `1. 項目` | `1. 項目`（5階層ネスト連番） | `1. 項目` | `1. 項目` |
| **箇条書き** | `- 項目` / `* 項目` | `• 項目` / `<ul><li>`（5階層ネスト） | `- 項目`（深層ネスト対応） | `- 項目`（単一階層） |
| **未完了タスク** | `- [ ] タスク` | `☐ タスク` | `☐ タスク` | `☐ タスク` |
| **完了タスク** | `- [x] 完了` | `☑ 完了` | `☑ ~~完了~~`（打消し線で強調） | `☑ 完了` |
| **インラインコード** | `` `コード` `` | `` `コード` `` / `<code>コード</code>` | `` `コード` `` | `` `コード` `` |
| **コードブロック** | ```` ```言語\nコード\n``` ```` | ネイティブ枠（PC: `slack/texty`） / `<pre><code>`（モバイル） | ネイティブコード枠（```` ``` ````） | 等幅コード枠（```` ``` ````） |
| **引用** | `> 引用` | ネイティブ引用枠（PC） / `<blockquote>`（モバイル） | `> 引用` | `> 引用` |
| **Callout** | `> [!NOTE] 内容` | 太字見出し付き引用枠（PC） / `<blockquote><b>`（モバイル） | `> **[NOTE]**`（または `> **[内容]**`） | `> *[NOTE]*`（または `> *[内容]*`） |
| **Webリンク** | `[タイトル](URL)` | `<URL\|タイトル>` / `<a href="...">` | `[タイトル](URL)` | `タイトル (URL)`（URL自動展開） |
| **Wikilink** | `[[ノート名\|別名]]` | `別名`（または `ノート名`） | `別名` | `別名` |
| **画像埋め込み** | `![[image.png\|300]]` | `[image: image.png]` | `[image: image.png]` | `[image: image.png]` |
| **メディア埋め込み**| `![[audio.mp3]]` | `[media: audio.mp3]` | `[media: audio.mp3]` | `[media: audio.mp3]` |
| **添付ファイル** | `![[file.pdf]]` | `[attachment: file.pdf]` | `[attachment: file.pdf]` | `[attachment: file.pdf]` |
| **数式（ブロック）** | `$$E = mc^2$$` | 等幅コードブロック保護 | 等幅コードブロック保護 | 等幅コードブロック保護 |
| **数式（インライン）**| `$x_1 * y_1$` | インラインコード保護 | インラインコード保護 | インラインコード保護 |
| **表（テーブル）** | Markdownテーブル | 等幅コードブロック（列幅自動整列） | 等幅コードブロック（列幅自動整列） | 等幅コードブロック（列幅自動整列） |

#### 各形式ごとの詳細仕様
- **Slack形式**:
  - **デスクトップ環境 (PC)**: Slack独自の内部クリップボード形式 **`slack/texty`**（Quill Delta JSON）を出力します。Slackアプリがネイティブ内部データとして認識するため、コードブロックの分断や多段リストの崩れを完全に防ぎ、100%の忠実度でリッチテキストコンテナを復元します。
  - **モバイル環境 (iOS / Android)**: モバイルSlackアプリの仕様に合わせて最適化された **HTML**（`<b>`, `<i>`, `<a>`, `<ul>`, `<ol>` 等）を出力します。最大5階層までの美しい多段ネストリスト（黒丸・白丸・四角の自動サイクルやアルファベット・ローマ数字の連番）やインライン装飾をネイティブ描画します。
  - **Webリンク**: Slack独自の `<URL|表示テキスト>` 記法に変換され、リンクとして正しくクリックできます。
  - **LaTeX数式のネイティブコード枠化**: インライン数式（`$E = mc^2$`）はインラインコード枠、ブロック数式（`$$...$$`）は複数行コードブロック枠として保護され、数式内のアンダースコア（`_`）やアスタリスク（`*`）による構文崩れを防止します。
- **Discord形式**:
  - **見出しフォールバック**: Discordがネイティブ対応している `#`（H1）、`##`（H2）、`###`（H3）はそのまま維持し、未対応の `####`〜`######`（H4〜H6）は自動的に太字（`**見出し**`）へフォールバックして視認性を保ちます。
  - **下線（Underline）**: Discordでは `__text__` が下線として機能するため、HTMLの `<u>` を `__text__` に変換します。また、標準Markdownの太字 `__text__` は下線と誤認されないよう `**text**` に自動統一されます。
  - **完了タスク**: チャット画面で完了状態がはっきりとわかるよう、自動的に打消し線（`☑ ~~完了~~`）を付与します。
  - **深層ネスト（多段リスト）**: DiscordのMarkdown仕様に合わせて、最大10段階までの深い階層（インデント）をそのまま維持してコピーします。
- **WhatsApp形式**:
  - **URLの自動展開**: WhatsAppはMarkdownのリンク記法 `[タイトル](URL)` を認識しないため、`タイトル (URL)` の形式に自動展開し、受信者がリンクをタップできるようにします。
  - **見出しの太字化**: WhatsAppには見出し記法（`#`）がないため、構造を崩さず強調できるよう `*見出し*` に変換します。
  - **箇条書きリスト**: WhatsAppの公式仕様に基づき、箇条書き（`- `）は単一階層のリストとして出力されます。
- **Markdown形式（Raw）**:
  - フォーマット変換を行わず、Obsidianで編集中のMarkdown原文のまま素早くコピーします。
- **全形式共通の安心機能**:
  - **テーブル自動整列**: チャット送信時に崩れやすいMarkdownテーブルは、CJK（日本語全角文字）の2幅分を正しく計算してパイプ（`|`）の位置を自動パディングし、等幅コードブロック（```` ```...``` ````）として保護します。
  - **数式記法の保護**: LaTeX数式内のアンダースコア（`_`）やアスタリスク（`*`）が斜体や太字に化けてしまわないよう、自動でコードとして退避・復元します。
  - **安全なリンクのみ許可**: `javascript:` や `data:` などの不正なスクリプトスキームを自動遮断し、XSS攻撃等を未然に防ぎます。

### 使い方
1. **リボン / ナビゲーションバー**: 画面左のリボン（PC）や画面下部のナビゲーションバー（モバイル）のアイコンを1タップするだけでコピー完了。
2. **モバイルキーボードツールバー**: Obsidianの「設定 > モバイル > ツールバーのオプション」から各形式のコマンドを登録すれば、キーボード上の専用アイコンから即座にコピー可能。
3. **ファイル一覧メニュー**: ファイル一覧でノートを長押し（モバイル）または右クリック（PC）して、ノートを開かずに直接好きな形式でコピー。
4. **コマンドパレット & ショートカット**: `Ctrl/Cmd + P` から「Slack形式に変換してコピー」などを検索して実行可能。

---

## Technical Documentation & Testing

- 📖 [Slack Internal Clipboard Specification (`slack/texty`)](./docs/slack-clipboard-spec.md): Technical deep-dive into Slack's proprietary Quill Delta clipboard format, block attributes, list nesting constraints, and reverse-engineered architecture.
- 🧪 **Manual Verification Test Suites**:
  - [Slack Comprehensive Test Suite](./tests/manual/slack-comprehensive-test.md): Full test fixture for Slack native Quill Delta format (headings, 5-level nested lists, tables, callouts, code blocks, task lists).
  - [Discord Comprehensive Test Suite](./tests/manual/discord-comprehensive-test.md): Full test fixture for Discord Markdown (native headings `#..###`, underline `__text__`, spoiler `||spoiler||`, task strikethroughs).
  - [WhatsApp Comprehensive Test Suite](./tests/manual/whatsapp-comprehensive-test.md): Full test fixture for WhatsApp syntax (`*bold*`, `_italic_`, `~strike~`, heading bolding, auto-expanded links `title (url)`).

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
