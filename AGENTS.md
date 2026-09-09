# AI Agent Guidelines (AGENTS.md)

Guidelines and operational principles for AI coding agents and human contributors working on **Format Convert Copy** (`obsidian-format-convert-copy`).

---

## 1. Development Environment & Docker Isolation (Mandatory)

To keep the host environment clean and reproducible:
- **Execute all commands inside Docker containers**:
  - `docker compose run --rm format-convert npm run build` (Type check & bundle)
  - `docker compose run --rm format-convert npm test` (Run unit tests with Vitest)
  - `docker compose run --rm format-convert npm install <package>` (Dependency management)
- Never run modifications or uncontained scripts directly on the host machine.

---

## 2. Cross-Platform Compatibility (Desktop & Mobile)

Format Convert Copy strictly supports both Desktop (macOS, Windows, Linux) and Mobile (iOS, Android):
- **Zero Node.js Built-ins**: Do NOT import or use `fs`, `path`, `crypto`, `os`, `http`, or `child_process`. They will crash on mobile WebViews.
- **Electron Isolation**: Any Electron-specific modules (`electron.clipboard`) must be guarded with `!Platform.isMobile` and wrapped in `try-catch`.
- **Clipboard Fallbacks**: Mobile iOS/Android WebViews have strict user gesture timeout rules. Always maintain robust fallbacks (`navigator.clipboard.writeText` -> `document.execCommand`).
- **UI Consistency**: Desktop-only features (e.g. editor context menu) must not intrude on mobile touch ergonomics.

---

## 3. Format Conversion Principles

- **Slack (`convertToSlackTexty` / `convertToSlack` / `convertToSlackHtml`)**:
  - **Native Quill Delta (`slack/texty`)**: Primary clipboard format for Desktop. Synthesizes Slack's internal Quill Delta format directly to avoid HTML parsing bugs (broken codeblocks and flattened lists). Refer to the full specification in [`docs/slack-clipboard-spec.md`](./docs/slack-clipboard-spec.md).
  - **mrkdwn & HTML fallbacks**: Plain text fallback (`*bold*`, `_italic_`, `~strike~`, `• bullet`) for mobile WebViews.
  - Convert Obsidian callouts (`> [!NOTE]`) and task list checkboxes (`- [ ]` -> `☐`, `- [x]` -> `☑`).
  - Sanitize URLs and protect code fences (` ``` `).
- **Discord (`convertToDiscord`)**:
  - Convert `__underline__` and `<u>` properly to Discord underline (`__text__`).
  - Convert checkboxes with strikethrough for completed items.
- **WhatsApp (`convertToWhatsApp`)**:
  - Support WhatsApp syntax (`*bold*`, `_italic_`, `~strike~`, ```` ```code``` ````).
  - Expand Markdown links `[title](url)` into `title (url)`.

---

## 4. Git Commit & Release Workflow

- **Conventional Commits**:
  - `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `sec:`
- **Automated GitHub Release via Tags**:
  - Tag push (`vX.Y.Z`) triggers `.github/workflows/release.yml` which tests, builds, and attaches `main.js`, `manifest.json`, and `styles.css`.
  - Bump versions synchronously using:
    ```bash
    npm version [patch | minor | major]
    git push origin master --tags
    ```

---

## 5. Domain Knowledge & Specialized Skills

For in-depth Obsidian API guidelines, Keychain storage, and UI patterns, refer to the local skill:
- **Obsidian Plugin Development**: [.agents/skills/obsidian-plugin-development/SKILL.md](./.agents/skills/obsidian-plugin-development/SKILL.md)
  - Architecture & lifecycle: `references/lifecycle-and-architecture.md`
  - Mobile compatibility: `references/mobile-compatibility.md`
  - Security & Keychain: `references/security-and-keychain.md`
  - UI & Design system: `references/ui-and-design-system.md`

---

## 6. Manual Testing Suite & Protocol

To ensure manual verification is consistent and reliable across all supported platforms without enforcing fixed local vault structures:
- **Repository Test Suites (`tests/manual/`)**:
  - **Slack Comprehensive**: [`tests/manual/slack-comprehensive-test.md`](./tests/manual/slack-comprehensive-test.md) (Headings, 5-level nested lists, ASCII/CJK tables, callouts, blockquotes, code blocks, task lists, math, Wikilinks).
  - **Slack Edge Cases**: [`tests/manual/slack-edge-cases.md`](./tests/manual/slack-edge-cases.md) (Visual rendering, consecutive blank line collapse, blockquote isolation, math-in-prose collisions, LaTeX subscripts, balanced parenthesis URLs).
  - **Discord Comprehensive**: [`tests/manual/discord-comprehensive-test.md`](./tests/manual/discord-comprehensive-test.md) (Native headings `#..###`, underline `__text__`, spoiler `||spoiler||`, task strikethroughs, tables, code blocks).
  - **WhatsApp Comprehensive**: [`tests/manual/whatsapp-comprehensive-test.md`](./tests/manual/whatsapp-comprehensive-test.md) (Bold `*text*`, italic `_text_`, strike `~text~`, heading bolding, URL link expansion `title (url)`, tables).
- **Mandatory Protocol for Impacted Code**:
  Whenever code affecting format conversion or clipboard output is modified (`src/converters/` or `src/utils/clipboard.ts`):
  1. Identify which format(s) are impacted (Slack, Discord, WhatsApp, or Common).
  2. Present the specific, actionable test items from the corresponding manual test suite(s) to the user/tester in your response.
  3. Explain the expected visual and functional result in each target application.
- **No Forced Placement**: Testers work with different vault structures, mobile environments, and cloud sync solutions. Never enforce or assume a fixed file placement on the tester's machine; provide the test notes in the repository so testers can copy, import, or place them wherever convenient in their own vaults.

---

## 7. Language & Privacy Policy (Strict Mandate)

All contributors and AI agents must adhere strictly to the project language and privacy standards:
- **English as Default Primary Language**:
  - All source code comments, docstrings, variable/function names, commit messages, PR titles/descriptions, and documentation files must be written in **English**.
- **Permitted Japanese / CJK Usage**:
  - Japanese or CJK text is strictly restricted to:
    1. Testing multi-byte string width calculations (`wcwidth` / `stringWidth`), character wrapping, or monospace column alignments in Markdown tables (e.g., `tests/manual/slack-comprehensive-test.md` Pattern C).
    2. Optional secondary Japanese translation documents (e.g. `README.ja.md`).
- **Zero Personal Data Policy**:
  - Real personal names, user handles, real email addresses, or individual identifiers are strictly forbidden anywhere in the repository (code, docs, tests, and commit history).
  - Always use neutral, generic technical terms (`Task A`, `Feature X`, `項目名`, `進捗状況`, `基本設計`, `完了`, `高`).

---

## 8. Testing Strategy & Fixture Lifecycle

Detailed testing architecture and guidelines are documented in [`docs/testing-policy.md`](./docs/testing-policy.md):
- **Two-Tier Model**: Complementary automated unit/snapshot tests (Vitest) + manual cross-platform suites (`tests/manual/`).
- **Canonical Suites vs. PoC Notes**:
  - Canonical suites (`*-comprehensive-test.md` and `*-edge-cases.md`) are the sole permanent manual test fixtures.
  - Temporary Proof-of-Concept notes (e.g., `*-poc-phase*.md`) used during exploratory prototyping must be consolidated into the canonical suites and retired (`git rm`) once verified.
- **Automated Snapshot Protection**:
  - Every canonical test fixture under `tests/manual/` must be covered by a snapshot test in `tests/*Snapshot.test.ts`.
  - CI must fail if any converter change or test note update causes undocumented snapshot differences.

