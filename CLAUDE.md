# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

基本方針・コーディング規約・運用フローは **[AGENTS.md](./AGENTS.md)** を参照してください。

## 重要な開発ルール

1. **コマンド実行はすべて Docker コンテナ内で実行する**:
   - `dev/CLAUDE.md` のマルチリポジトリ原則に従い、ホストの Node.js は一切使用せず、必ず Docker 経由で実行すること。
2. **よく使うコマンド**:
   - テスト実行: `docker compose run --rm format-convert npm test`
   - ビルド実行: `docker compose run --rm format-convert npm run build`
   - 開発ビルド/Watch: `docker compose run --rm format-convert npm run dev`
3. **モバイル (iOS / Android) 互換性**:
   - モバイル環境でクラッシュする Node.js 組み込み API（`fs`, `path`, `crypto` など）は使用不可。
   - `require("electron")` は必ず `!Platform.isMobile` ガードと `try-catch` で囲む。
