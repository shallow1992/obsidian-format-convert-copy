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
