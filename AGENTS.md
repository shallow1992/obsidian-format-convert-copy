# AI Agent Guidelines (AGENTS.md)

Guidelines and operational principles for AI coding agents and human contributors working on **Format Convert Copy** (`obsidian-format-convert-copy`).

---

## 1. Development Environment & Docker Isolation (Mandatory)

To keep the host environment clean, isolated, and fully reproducible:
- **Execute all project commands inside Docker containers**:
  - `docker compose run --rm format-convert-copy npm run build` (Type check & bundle)
  - `docker compose run --rm format-convert-copy npm test` (Run unit & snapshot tests with Vitest)
  - `docker compose run --rm format-convert-copy npm install <package>` (Dependency management)
- **Zero Host Execution**: Never install dependencies or run uncontained build/test scripts directly on the host machine.
- **Single-Command Execution**: When running shell commands, execute each command individually (avoid chaining with `&&`, `;`, or `||`) to preserve command auto-approval allowlists.

---

## 2. Cross-Platform Compatibility (Desktop & Mobile)

Format Convert Copy strictly supports both Desktop (macOS, Windows, Linux) and Mobile (iOS, Android):
- **Zero Node.js Built-ins**: Do NOT import or use `fs`, `path`, `crypto`, `os`, `http`, or `child_process`. They will crash on mobile WebViews.
- **Electron Isolation**: Any Electron-specific modules (`electron.clipboard`) must be guarded with `!Platform.isMobile` and wrapped in `try-catch`.
- **Clipboard Fallbacks**: Mobile iOS/Android WebViews have strict user gesture timeout rules. Always maintain robust fallbacks (`navigator.clipboard.writeText` -> `document.execCommand`).
- **UI Consistency**: Desktop-only features (e.g. editor context menu) must not intrude on mobile touch ergonomics.

---

## 3. Format Conversion Architecture & Specifications

- **Slack (`convertToSlackTexty` / `convertToSlackMobileHtml` / `convertToSlack`)**:
  - **Native Quill Delta (`slack/texty`)**: Primary clipboard format for Desktop. Synthesizes Slack's internal Quill Delta format directly to avoid HTML parsing bugs (broken codeblocks and flattened lists). Refer to the full specification in [`docs/slack-clipboard-spec.md`](./docs/slack-clipboard-spec.md).
  - **Semantic HTML (`text/html`)**: Primary clipboard format for Mobile iOS/Android. Synthesizes sanitized HTML with standard tags (`<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<a>`, `<ul>`, `<ol>`, `<p>`) and `<p>&gt; ...</p>` for blockquotes.
  - **mrkdwn Plain Text Fallback**: Fallback plain text format (`*bold*`, `_italic_`, `~strike~`, `• bullet`).
  - Convert Obsidian callouts (`> [!NOTE]`) and task list checkboxes (`- [ ]` -> `☐`, `- [x]` -> `☑`).
  - Sanitize URLs, preserve monospace column alignment for tables in code fences, and isolate LaTeX math formulas.
- **Discord (`convertToDiscord`)**:
  - Convert `__underline__` and `<u>` properly to Discord underline (`__text__`).
  - Convert checkboxes with strikethrough for completed items (`- [x]` -> `☑ ~item~`).
- **WhatsApp (`convertToWhatsApp`)**:
  - Support WhatsApp syntax (`*bold*`, `_italic_`, `~strike~`, ```` ```code``` ````).
  - Expand Markdown links `[title](url)` into `title (url)`.

---

## 4. Git Workflow, Conventional Commits & Releases

- **Conventional Commits**:
  - Commit messages and PR titles must use standard prefixes:
    - `feat:` (New features)
    - `fix:` (Bug fixes)
    - `refactor:` (Code refactoring with no functional change)
    - `docs:` (Documentation changes)
    - `test:` (Adding or updating tests)
    - `ci:` (CI/CD workflows and configuration)
    - `chore:` (Dependencies, release chores, maintenance)
    - `sec:` (Security vulnerability fixes)
- **PR Merge Strategy (Squash and Merge)**:
  - All feature branches must be squash-merged into `master` to maintain a clean, linear git history.
- **Remote CI Verification Obligation (Mandatory)**:
  - After pushing branches or opening PRs, agents must verify GitHub Actions CI status (`gh pr checks <PR>` or `gh run view`).
  - Never merge a PR until all CI checks pass (All Green).
- **Automated GitHub Release via Tags**:
  - Tag push (`vX.Y.Z`) triggers `.github/workflows/release.yml` which tests, builds, and attaches `main.js`, `manifest.json`, and `styles.css`.
  - Bump versions synchronously using:
    ```bash
    npm version [patch | minor | major]
    git push origin master --tags
    ```

---

## 5. Language Policy (English Standard)

To maintain international accessibility and seamless collaboration:
- **English as Default Primary Language**:
  - All source code comments, docstrings, variable/function names, commit messages, PR titles/descriptions, and documentation files must be written in **English**.
- **Permitted Japanese / CJK Usage**:
  - Japanese or CJK text is strictly restricted to:
    1. Testing multi-byte string width calculations (`wcwidth` / `stringWidth`), character wrapping, or monospace column alignments in Markdown tables (e.g., `tests/manual/slack-comprehensive-test.md` Pattern C).
    2. Optional secondary Japanese translation documents (e.g. `README.ja.md`).

---

## 6. Testing Architecture & Quality Assurance

Quality assurance guidelines and testing architecture are detailed in [`docs/testing-policy.md`](./docs/testing-policy.md):
- **Two-Tier Model**:
  - **Tier 1 (Automated Tests)**: Vitest unit tests (`tests/*.test.ts`) and regression snapshot tests (`tests/*Snapshot.test.ts`).
  - **Tier 2 (Manual Cross-Platform Suites)**: Real-app verification notes under `tests/manual/`.
- **Canonical Manual Suites**:
  - **Slack Comprehensive**: [`tests/manual/slack-comprehensive-test.md`](./tests/manual/slack-comprehensive-test.md) (Headings, 5-level nested lists, ASCII/CJK tables, callouts, blockquotes, code blocks, task lists, math, Wikilinks).
  - **Slack Edge Cases**: [`tests/manual/slack-edge-cases.md`](./tests/manual/slack-edge-cases.md) (Visual rendering, consecutive blank line collapse, blockquote isolation, math-in-prose collisions, LaTeX subscripts, balanced parenthesis URLs).
  - **Discord Comprehensive**: [`tests/manual/discord-comprehensive-test.md`](./tests/manual/discord-comprehensive-test.md) (Native headings `#..###`, underline `__text__`, spoiler `||spoiler||`, task strikethroughs, tables, code blocks).
  - **WhatsApp Comprehensive**: [`tests/manual/whatsapp-comprehensive-test.md`](./tests/manual/whatsapp-comprehensive-test.md) (Bold `*text*`, italic `_text_`, strike `~text~`, heading bolding, URL link expansion `title (url)`, tables).
- **Mandatory Protocol for Impacted Code**:
  Whenever code affecting format conversion or clipboard output is modified (`src/converters/` or `src/utils/clipboard.ts`):
  1. Identify which format(s) are impacted (Slack, Discord, WhatsApp, or Common).
  2. Present the specific, actionable test items from the corresponding manual test suite(s) to the user/tester in your response.
  3. Explain the expected visual and functional result in each target application.
- **Fixture Lifecycle (No Persistent PoC Notes)**:
  - Canonical suites (`*-comprehensive-test.md` and `*-edge-cases.md`) are the only permanent manual fixtures.
  - Temporary Proof-of-Concept notes (e.g., `*-poc-phase*.md`) used during exploratory prototyping must be consolidated into the canonical suites and retired (`git rm`) once verified.
- **Automated Snapshot Protection**:
  - Every canonical test fixture under `tests/manual/` must be covered by a snapshot test in `tests/*Snapshot.test.ts`.
  - CI must fail if any converter change or test note update causes undocumented snapshot differences.
- **No Forced Placement**:
  - Testers work with different vault structures, mobile environments, and cloud sync solutions. Never enforce or assume a fixed file placement on the tester's machine.

---

## 7. Domain Knowledge & Specialized Skills

For in-depth Obsidian API guidelines, Keychain storage, and UI patterns, refer to the local skill:
- **Obsidian Plugin Development**: [.agents/skills/obsidian-plugin-development/SKILL.md](./.agents/skills/obsidian-plugin-development/SKILL.md)
  - Architecture & lifecycle: `references/lifecycle-and-architecture.md`
  - Mobile compatibility: `references/mobile-compatibility.md`
  - Security & Keychain: `references/security-and-keychain.md`
  - UI & Design system: `references/ui-and-design-system.md`

---

## 8. Privacy, Confidentiality & Leak Prevention (Zero Personal Data)

To ensure complete privacy, security, and anonymity across all public repositories, contributions, and documentation, all contributors and AI agents must enforce a **Zero Personal Data** standard.

### Core Policy
No personal information (PII), real individual names, private identifiers, personal accounts, or host-specific environmental footprints may ever be committed, pasted, or recorded in the repository.

### Leak Vectors & Prevention Rules
1. **Source Code, Comments & Docstrings**:
   - Never embed real personal names, author attribution tags (`@author <name>`), real email addresses, or personal contact details in code or comments.
2. **Git Metadata & Author Identity**:
   - Ensure local Git configuration (`user.name`, `user.email`) does not leak real full names or private personal/corporate email addresses. Use generic pseudonyms and GitHub noreply addresses (`<username>@users.noreply.github.com`).
   - Never include real individual names or private organizational identifiers in commit messages, commit descriptions, or PR titles.
3. **Branch Names & Git Tags**:
   - Never include personal names or individual identifiers in branch names (e.g., use `feat/table-cjk-align` instead of `john/table-align`).
4. **Test Fixtures, Mock Data & Sample Inputs**:
   - Never use real personal names, actual phone numbers, real Slack/Discord user IDs, or company-specific workspace URLs/channel names in test markdown files or test cases.
   - Always use RFC 2606 reserved domains (`example.com`, `example.org`), standard dummy personas (`Alice`, `Bob`), or neutral generic terminology (`Task A`, `Feature X`, `項目名`, `進捗状況`, `基本設計`, `完了`, `高`).
5. **Terminal Logs, Error Traces & Debug Dumps**:
   - When copying shell sessions, compiler outputs, or error stack traces into docs, issues, PR descriptions, or test notes, sanitize all host machine names, OS usernames, and local absolute filesystem paths (e.g. replace `/Users/<username>/...` or `C:\Users\<username>\...` with `<repo-root>/...` or generic placeholders).
6. **Media Artifacts (Screenshots & Recordings)**:
   - When attaching UI verification screenshots or screen recordings to PRs, issues, or documentation, ensure they do not expose browser bookmarks, open tabs, OS menu bars, account profile pictures, workspace names, or desktop notifications. Crop tightly to the UI element being demonstrated.
7. **Credentials, Tokens & Network Payloads**:
   - Never commit or paste raw API keys, OAuth tokens, session cookies, Authorization headers, or network capture files (HAR dumps). Secrets must be managed via OS Keychain or secure environment variables.
8. **Dotfiles & Local Workspace Artifacts**:
   - Ensure `.DS_Store`, local IDE configs (`.vscode/`, `.idea/`), shell history (`.zsh_history`), and local unignored `.env` files are never tracked or staged.
