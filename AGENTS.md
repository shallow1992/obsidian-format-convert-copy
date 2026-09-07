# AI Agent Guidelines (AGENTS.md)

本プロジェクト（`obsidian-format-convert`）における開発指針・運用ルールです。
Claude Code、Gemini (Antigravity)、Copilot 等すべての AI コーディングエージェントはこの指針に従ってください。

---

## 1. 開発環境・Docker 隔離ルール (最重要)

- **ホスト環境の保護 (Docker 実行)**:
  - ホスト PC の Node.js 環境を汚さないため、パッケージの追加・テスト実行・ビルド検証などのコマンド実行は **すべて Docker コンテナ内（`docker compose run --rm format-convert <command>`）** で実行すること（例外なし）。
  - 例:
    - ビルド: `docker compose run --rm format-convert npm run build`
    - テスト: `docker compose run --rm format-convert npm test`
    - パッケージ追加: `docker compose run --rm format-convert npm install <package>`
- **破壊的操作の確認**:
  - ファイル削除・イメージやボリュームの削除等は事前に対象を明示して承認を得てから実行する。

---

## 2. モバイル・デスクトップ両対応の設計規約

- **モバイル互換性 (iOS / Android)**:
  - Node.js 組み込みモジュール（`fs`, `path`, `crypto`, `http` 等）のインポート・使用は厳禁。
  - Electron 依存コード（`require("electron")`）は必ずデスクトップ環境判定（`!Platform.isMobile`）と `try-catch` で保護し、モバイル環境で例外が発生しないようにする。
- **クリップボード書き込み**:
  - モバイル（iOS Safari / WKWebView）は非同期 Clipboard API やリッチテキスト書き込みに厳しい制約（ユーザー操作イベントの有効期限）がある。
  - モバイル時はフォールバックとして `navigator.clipboard.writeText()` によるプレーンテキスト書き込みを優先・保証すること。
- **モバイル UX**:
  - 画面の狭いモバイル端末でも使いやすいよう、モバイルツールバー（リボンアイコン・クイックアクション・コマンドパレット）からの呼び出しに配慮する。

---

## 3. フォーマット変換設計規約

- **Slack変換**:
  - プレーンテキスト記法（mrkdwn: `*太字*`, `_斜体_`, `~打消し~`, `• リスト`）と、リッチテキストHTML記法（`<b>`, `<i>`, `<s>`, `<ul>/<li>`）の両方をサポートする。
  - 見出しは太字へフォールバック。
  - Wikilink（`[[ノート名|表示名]]`）は表示名を優先抽出。
  - タスクリスト（`- [ ]`, `- [x]`）は適切な記号（`☐`, `☑`）またはテキストに変換する。
  - コードフェンス（```）内の文字列は変換から完全に保護する。
- **Discord変換**:
  - Discord Markdown（`**太字**`, `*斜体*`, `__下線__`, `~~打消し~~`, `> 引用`）に変換する。
  - 標準Markdownの `__下線__` と太字の混同に注意。

---

## 4. CI/CD & コミット運用ルール

- **コミットメッセージ規約 (Conventional Commits)**:
  - `feat:` (新機能の追加)
  - `fix:` (バグ修正)
  - `refactor:` (リファクタリング・コード改善)
  - `docs:` (ドキュメントの追加・更新)
  - `test:` (テストの追加・修正)
  - `chore:` (依存関係・バージョン更新・ビルド設定)
- **環境固有情報・個人情報の混入禁止**:
  - ホスト PC 名、OS ユーザー名、実メールアドレス、ローカル絶対パス（`C:\Users\...`, `/Users/...`）をコミットに混入させない。

---

## 5. リリース運用フロー ＆ GitHub Release 発行手順 (BRAT 連携)

- **自動リリースワークフロー (`.github/workflows/release.yml`)**:
  - バージョンタグ（`vX.Y.Z` または `X.Y.Z`）を push すると、GitHub Actions が自動起動：
    1. 単体テスト（Vitest）を実行
    2. プラグインをビルド（`npm run build`）
    3. リリースアセット（`main.js`, `manifest.json`, `styles.css`）を添付して GitHub Release を自動作成
- **バージョン同期手順**:
  - `npm version [<newversion> | major | minor | patch]` を実行すると、`version-bump.mjs` が連動して `manifest.json` および `versions.json` を自動同期しコミットする。
  ```bash
  npm version patch
  git push origin master --tags
  ```
- **Obsidian BRAT での検証**:
  - GitHub Release にアセットが添付されるため、Obsidian の BRAT プラグインから即座に最新リリースを端末（iOS / Android / Desktop）へ取得・検証可能。
