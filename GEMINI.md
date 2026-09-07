# GEMINI.md

This file provides guidance to Gemini / Antigravity when working with code in this repository.

基本方針・コーディング規約・運用フローは **[AGENTS.md](./AGENTS.md)** を参照してください。

## 重要な開発ルール

1. **コマンド実行はすべて Docker コンテナ内で実行する**:
   - ホスト環境を汚さないため、`docker compose run --rm format-convert <command>` を徹底すること。
   - テスト: `docker compose run --rm format-convert npm test`
   - ビルド: `docker compose run --rm format-convert npm run build`
2. **モバイル (iOS / Android) とデスクトップの両対応を厳守する**:
   - Node.js 組み込みモジュールの使用禁止。
   - クリップボード処理はモバイルフォールバックを常に維持する。
3. **コード構造**:
   - `src/` 配下に機能別（`converters/`, `utils/`, `settings.ts`）にモジュール化する。
