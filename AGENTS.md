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

- **Slack (`convertToSlack` / `convertToSlackHtml`)**:
  - Support mrkdwn plain text (`*bold*`, `_italic_`, `~strike~`, `• bullet`) and rich HTML (`<b>`, `<i>`, `<s>`, `<ul>/<li>`).
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
