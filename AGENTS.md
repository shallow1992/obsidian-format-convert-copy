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

To ensure manual verification is consistent across varying environments:
- **Repository Test Suite**: Maintain a comprehensive Markdown test note in the repository at [`tests/manual/slack-comprehensive-test.md`](./tests/manual/slack-comprehensive-test.md). This file covers headings, inline formatting, 5-level nested lists, tables, callouts, blockquotes, code blocks, task lists, and edge cases.
- **Protocol for Impacted Code**: Whenever changes affect conversion or clipboard logic, identify and present the specific test items from the test suite to the user/tester.
- **No Forced Placement**: Testers work with different vault structures, OS platforms, and cloud sync solutions. Never enforce or assume a fixed file placement on the tester's machine; provide the test note in the repo so testers can copy, import, or place it wherever convenient in their own vaults.
