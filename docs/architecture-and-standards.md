# Architecture & Quality Standards (Architecture & Standards)

本ドキュメントは、Obsidian コミュニティ公式審査基準に準拠したアーキテクチャ設計原則、型安全性基準、設定 UI 設計、および CI/CD セキュリティ仕様（Why・設計意図）を永続化するドキュメントです。

---

## 1. 型安全性と厳格な型付け (Strict Type Safety)

### 背景と目的
Obsidian 公式の自動審査（Community Directory Reviews）では、TypeScript コードにおける暗黙的・明示的な `any` の使用、および `@typescript-eslint/no-unsafe-*` に該当する操作（型が不透明なオブジェクトのプロパティ参照や引数渡し）が厳しくチェックされます。

### 設計方針
1. **正規表現 `replace()` コールバックの明示的型定義**:
   - `String.prototype.replace(regex, replacer)` において、TypeScript の標準型推論はキャプチャグループの型を `any` として扱う場合がある。
   - すべてのコンバーター（`common.ts`, `slack.ts`, `slackMobile.ts`, `whatsapp.ts`, `discord.ts`）において、コールバック関数の引数に `(_match: string, ...)` と明示的に型注釈を付与し、暗黙の `any` 伝播を完全に遮断する。
2. **DeltaOp 属性の型安全化 (`slackTexty.ts`)**:
   - 外部ライブラリ由来の属性マップを `Record<string, any>` から `Record<string, unknown>` に置換。
   - プロパティ検証関数（`areAttrsEqual` 等）で厳格に比較を行い、型安全性を担保。
3. **設定代入における Boolean 型制約 (`settings.ts`)**:
   - `FormatConvertSettings` のフィールドにトグル値を代入する際、`as any` によるインデックスアクセスを廃止。
   - `BooleanSettingKey`（`FormatConvertSettings[K]` が `boolean` であるキーのみのユニオン）を型レベルで抽出し、型安全なプロパティアクセスを保証。
4. **設定読み込み時の型ガード (`main.ts`)**:
   - `this.loadData()` は Obsidian API 上 `Promise<any>` を返すため、`Partial<FormatConvertSettings> | null` への型アサーションおよび nullish 合流演算子（`?? {}`）を用いてデフォルト設定（`DEFAULT_SETTINGS`）と安全にマージする。

---

## 2. 宣言的設定 API (`getSettingDefinitions`) と Dual Support 設計

### 背景と目的
Obsidian 1.13.0 より、プラグイン設定画面の宣言的 API である `PluginSettingTab.prototype.getSettingDefinitions()` が導入されました。この API を実装することで、プラグインの設定項目が Obsidian 全体の「設定検索」でインデックスされ、ユーザーが検索窓から各設定項目へ直接アクセスできるようになります。

### Dual Support（下位互換性維持）アーキテクチャ
本プラグインの `manifest.json` における `minAppVersion` は `1.4.0` をサポート対象としています。
そのため、最新 Obsidian（1.13.0+）の検索機能を取り入れつつ、旧バージョン（1.4.0〜1.12.x）でも問題なく動作するよう「Dual Support」設計を採用しています。

- **Obsidian 1.13.0 以降の動作**:
  - `getSettingDefinitions()` が非空の配列（`SettingDefinitionItem[]`）を返すと、Obsidian はそれを自動検知して宣言的 UI を描画し、設定検索インデックスに登録します。この場合、従来の `display()` は Obsidian 側で呼び出されません。
  - 値の取得・保存は `getControlValue()` / `setControlValue()` が担います。
- **Obsidian 1.13.0 未満の動作**:
  - `getSettingDefinitions()` は無視され、従来の命令的レンダリングを行う `display()` メソッドが実行されます。
  - `addToggleSetting()` 経由で Obsidian 標準の `Setting` クラスを用いて DOM が構築されます。

---

## 3. GitHub Artifact Attestations（ビルド証明）

### 背景と目的
Obsidian コミュニティ審査では、リリースアセット（`main.js`, `styles.css`）が改ざんされておらず、公開されたソースコードリポジトリから GitHub Actions 上でビルドされた正当なものであることを暗号学的に証明するため、GitHub Artifact Attestations の導入が推奨されています。

### CI 設定 (`.github/workflows/release.yml`)
- **付与権限 (Permissions)**:
  - `id-token: write`: OpenID Connect (OIDC) トークンを取得し、GitHub Actions の実行IDとリポジトリ署名を生成するために必須。
  - `attestations: write`: 生成した Attestation を GitHub 側の透明性ログに記録するために必須。
- **実行ステップ**:
  - `actions/attest-build-provenance@v2` をビルド後・リリース作成前に実行し、`main.js` および `styles.css` のハッシュ値とビルド環境の検証ログを自動署名。

---

## 4. テーブル列幅計算と Unicode 書記素クラスタ (Grapheme Cluster & Surrogate Pairs)

### 背景と目的
Markdown テーブルを Slack や固定幅テキスト形式に変換する際、`getStringWidth()` で各セルの文字幅を計算してスペースパディングを付与し、等幅フォント環境で縦の罫線を整列させます。
従来の単純な UTF-16 反復や狭い CJK 判定では、以下のケースで列の幅計算にずれが生じていました：
- **サロゲートペア**: UTF-16 で 2 コードユニットを消費する文字（例: `𠮷`（U+20BB7）等の CJK 統合漢字拡張）が正しく認識されない。
- **Unicode 絵文字**: `🚀`, `📝`, `🎉` や、合字・ZWJ シーケンス（`👨‍👩‍👧‍👦`）、国旗（`🇯🇵`）、異体字セレクタ付き絵文字（`☁️`）が幅 1（半角扱い）または複数文字分の幅として誤算される。

### 設計方針
1. **書記素クラスタ（Grapheme Cluster）分割**:
   - `Intl.Segmenter`（`granularity: "grapheme"`）を活用し、人間が 1 文字として認識するグラフィーム単位（合字や ZWJ シーケンスを含む）で分割。未対応環境では `Array.from()` でコードポイント単位にフォールバック。
2. **文字幅の厳密な判定 (`getGraphemeWidth`)**:
   - **幅 0 (Zero Width)**: ゼロ幅文字（ZWJ, ZWNJ, BOM, 異体字セレクタ, スキンカラー修飾子等）。
   - **幅 1 (Half Width)**: ASCII 標準文字、半角カナ（`0xFF61`〜`0xFF9F`）。
   - **幅 2 (Full Width)**: CJK 基本多言語面、CJK 統合漢字拡張（Plane 2: `0x20000`〜`0x323AF`）、絵文字ブロック（`0x1F300`〜`0x1FAFF`, `0x2600`〜`0x27BF`, シンボル類）。
   - 結合絵文字（ZWJ や `\uFE0F` を含むクラスタ）は全体で幅 2 として評価。

---

## 5. クリップボード制御パイプラインとレガシー API (`execCommand`) の完全廃止

### 背景と課題
過去の実装では、古いブラウザ環境や権限拒絶時のセーフティネットとして `document.execCommand("copy")`（DOM `copy` イベント経由および非表示 `textarea` 要素へのフォールバック）を保持していました。
しかし、Obsidian のコミュニティディレクトリ自動審査（Automated Review）にて `execCommand is deprecated` が指摘されたことを受け、現代の Obsidian 実行環境における要件を再精査しました。

### 現代の Obsidian 実行環境における検証
1. **デスクトップ (Mac / Windows / Linux)**:
   - Chromium ベースの Electron 環境であり、`window.require("electron").clipboard`（OS ネイティブのクリップボード制御）および `navigator.clipboard` が 100% 確実に動作します。
2. **iOS (iPhone / iPad)**:
   - 本プラグインの要求環境である `minAppVersion: 1.4.0` を満たす Obsidian（iOS 16 以降）では、WebKit の非同期 Clipboard API（`ClipboardItem`）が標準搭載されており、`execCommand` を必要とする環境は存在しません。
3. **Android**:
   - Android System WebView（Chromium 66 以降）において `navigator.clipboard` は完全対応済みです。

### 新しいクリップボード制御パイプライン (`src/utils/clipboard.ts`)
レガシーな DOM 要素（`textarea`）生成や `execCommand` を完全に撤廃し、以下のクリーンな多層パイプラインに一本化しました：

1. **カスタム MIME 形式 (Slack Texty 形式 - デスクトップ)**:
   - デスクトップ環境では `electron.clipboard.writeBuffer(mime, new TextEncoder().encode(content))` を用いて `slack/texty` 等の独自バッファを OS クリップボードへ直接書き込みます。
2. **リッチテキスト HTML 形式**:
   - デスクトップ: `electron.clipboard.write({ text, html })` で同期的にアトミック書き込み。
   - モバイル: `navigator.clipboard.write([new ClipboardItem(...)])` による WebKit / Chromium 標準の非同期書き込み。
3. **プレーンテキスト形式 / フォールバック**:
   - `navigator.clipboard.writeText(text)` による標準非同期書き込み。
4. **エラーハンドリング**:
   - いずれのモダン API も成功しなかった場合は、安全に `return false` とし、Obsidian 標準の通知 UI（`Notice: Failed to copy to clipboard`）を表示。DOM 汚染やレガシー API への依存は一切発生しません。

---

## 6. 通知設定の肯定形モデル化 (`showNotification`) と後方互換マイグレーション

### 背景と課題
従来のコピー完了通知設定は `silentMode: boolean`（通知を非表示にするトグル）という否定形の設定になっていました。トグルを ON にすると「通知が出なくなる」という挙動は、直感に反しやすく認知的負荷（二重否定の混乱）を生む要因となっていました。

### 設計方針
1. **肯定形トグルへのリファクタリング (`showNotification`)**:
   - 項目名を「通知を表示（Show notifications）」、デフォルト値を `true`（通知を表示する）に変更。
   - 一般的な Obsidian プラグインおよびモダン UI 標準に準拠し、ON = 通知表示、OFF = 通知非表示（旧サイレントモード相当）と直感的に一致させました。
2. **既存設定のシームレスな自動マイグレーション (`loadSettings`)**:
   - 既存ユーザーの `data.json` に `silentMode` が保存されていた場合、`showNotification = !loadedData.silentMode` として設定値を反転継承します。
   - 移行完了後は古いプロパティ `silentMode` を設定オブジェクトから安全に削除（`delete`）し、設定保存時に新しいクリーンなスキーマへと統一されます。
3. **Dual Support（設定検索 ＆ 従来描画）の整合性維持**:
   - Obsidian 1.13.0+ の宣言的 API（`getSettingDefinitions`）および旧バージョン向けの命令的描画（`display()`）の双方で、一貫して `showNotification` をコントロール対象としてバインドしています。

---

## 7. 初期導入 UX の最適化とデフォルト設定値の設計方針 (Out-of-the-Box UX)

### 背景と目的
初期状態において特定の単一形式（Slack）のみが個別アイコンとして有効化されていると、他形式（Discord, WhatsApp, Markdown）の利用者が戸惑い、また UI が乱立する要因となっていました。
そのため、書式選択の初期設定は「形式を選択してコピー」のみを ON とし、個別形式アイコンおよび PC 版エディタ右クリックメニューはデフォルトで OFF に整理しました。

### 設計方針
1. **書式選択は「形式を選択してコピー」のみを初期有効化**:
   - **リボン / ナビゲーションバー**: `showRibbonMenuIcon: true` のみ ON、個別形式（`showRibbonSlackIcon` 等）はすべて `false`。
   - **ファイルエクスプローラ**: `showFileMenuItem: true` のみ ON、個別形式（`showFileSlackItem` 等）はすべて `false`。
   - これにより、UI をすっきり保ちつつ、初回ユーザーがワンタップで全フォーマットを直感的に選択・コピーできる体験を提供します。
2. **PC 版エディタ右クリックメニューはデフォルト OFF**:
   - エディタ内右クリックメニューは Obsidian のコンテキストメニュー領域を圧迫しやすいため、初期状態ではすべて OFF（`showSlackInMenu: false`, `showDiscordInMenu: false`, `showWhatsAppInMenu: false`, `showRawInMenu: false`）とし、必要なユーザーが設定から有効化するオプトイン設計としました。
3. **安全かつ予測可能な基本挙動の維持**:
   - **全面コピー (`emptySelectionBehavior: "document"`)**: 未選択時はノート全体をコピーする標準挙動。
   - **通知表示 (`showNotification: true`)**: コピー完了の成否がトースト（Notice）で確実にフィードバックされる挙動。

