# Testing Strategy, Architecture & Quality Policy

This document outlines the testing architecture, quality assurance procedures, fixture lifecycle, and privacy/language policies for **Format Convert Copy** (`obsidian-format-convert-copy`).

---

## 1. Two-Tier Testing Architecture

Format Convert Copy employs a complementary two-tier testing strategy to ensure syntax correctness, platform compatibility, and visual rendering fidelity across Desktop and Mobile (iOS/Android):

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Automated Testing (Vitest & GitHub Actions CI)       │
│  - Unit tests for converters (syntax parsers & edge cases)  │
│  - Snapshot regression tests for all manual suites          │
│  - 100% test pass required for every commit & PR            │
└──────────────────────────────┬──────────────────────────────┘
                               │ protects & validates
┌──────────────────────────────▼──────────────────────────────┐
│ Tier 2: Manual Cross-Platform Verification (tests/manual/)  │
│  - Real-device copy-paste validation (Slack/Discord/WA)     │
│  - Platform-specific visual rendering inspection            │
│  - Canonical suites: Comprehensive vs. Edge Cases           │
└─────────────────────────────────────────────────────────────┘
```

### Tier 1: Automated Unit & Snapshot Tests
- **Unit Tests (`tests/*.test.ts`)**:
  - Test individual converters (`slack.ts`, `slackMobile.ts`, `discord.ts`, `whatsapp.ts`) against isolated markdown fragments.
  - Verify boundary conditions, HTML escaping, regex protections, and fallback mechanisms.
- **Snapshot Tests (`tests/*Snapshot.test.ts`)**:
  - Ingest the canonical manual test suites directly from `tests/manual/` and convert them through the respective format pipelines (Slack Quill Delta, Slack Mobile HTML, Discord, WhatsApp).
  - Snapshot assertions (`toMatchSnapshot()`) guarantee that any unintended change in converter output or formatting structure is caught instantly during local testing and GitHub Actions CI.

### Tier 2: Manual Cross-Platform Verification
Obsidian plugins interact directly with operating system pasteboards and proprietary target app normalizers (such as Slack's Quill engine, Discord's markdown parser, or WhatsApp's text styling). Some rendering defects (e.g. mobile pasteboard collapsing consecutive empty lines, font column alignment, or touch interaction) can only be verified on physical devices or native client apps.

---

## 2. Canonical Manual Test Suite Structure

All manual verification notes reside in `tests/manual/`. They are divided into two distinct, standardized categories:

### 1. Comprehensive Test Suites (`*-comprehensive-test.md`)
- **Scope**: Full breadth of supported Markdown syntax.
- **Contents**:
  - Headings (H1 through H6)
  - Inline formatting (Bold, Italic, Underline, Strikethrough, Inline Code, Hyperlinks, nested combinations)
  - Bulleted lists (up to 5 levels of nesting)
  - Numbered lists (up to 5 levels with alphabetical/roman fallback markers)
  - Task lists / Checklists (Incomplete `☐` vs. Completed `☑ <s>...</s>`)
  - Mixed nested list hierarchies
  - Blockquotes and Obsidian Callouts (`> [!NOTE]`, `> [!WARNING]`)
  - Code blocks (syntax highlighted and plain)
  - Monospace aligned tables (Standard ASCII, inline code cells, CJK full-width columns)
  - LaTeX math ($inline$ and $$block$$)
  - Obsidian internal links (Wikilinks `[[page|alias]]` and image attachments)
- **Files**:
  - [`tests/manual/slack-comprehensive-test.md`](../tests/manual/slack-comprehensive-test.md)
  - [`tests/manual/discord-comprehensive-test.md`](../tests/manual/discord-comprehensive-test.md)
  - [`tests/manual/whatsapp-comprehensive-test.md`](../tests/manual/whatsapp-comprehensive-test.md)

### 2. Edge-Cases Test Suites (`*-edge-cases.md`)
- **Scope**: Subtle, complex, or visual interaction edge cases discovered during real-world usage and cross-platform verification.
- **Contents**:
  - Consecutive blank line preservation (e.g. 1, 2, 3 blank lines without normalizer collapse)
  - Soft line breaks within a paragraph vs. hard paragraph breaks
  - Blockquote isolation (preventing separate quotes from merging across blank lines)
  - Spacing between disparate block types (e.g., lists immediately preceding headings, code blocks preceding tables)
  - Delimiter and character collisions (e.g., headings containing `$$` near block math, prose containing dollar signs `$100`)
  - LaTeX math subscript underscore collisions (preventing `$x_1 * y_1$` from triggering markdown italics)
  - URLs containing balanced parentheses (e.g. Wikipedia links)
- **Files**:
  - [`tests/manual/slack-edge-cases.md`](../tests/manual/slack-edge-cases.md)

---

## 3. Lifecycle of PoC & Exploratory Fixtures

During exploratory research, prototyping, or incremental bug reproduction, temporary Proof-of-Concept (PoC) notes are often created (e.g. `slack-ios-poc-phase1~4.md`).

To keep the test suite cohesive and maintainable:
1. **Ephemeral by Design**: PoC fixtures are temporary scratchpads for active investigation. They must never become permanent parallel test suites.
2. **Consolidation**: Once the investigation is complete and the implementation is stabilized:
   - Any novel syntax tests must be consolidated into the canonical `*-comprehensive-test.md`.
   - Any rendering edge cases or normalizer quirks must be consolidated into `*-edge-cases.md`.
3. **Retirement**: The temporary PoC files must be deleted (`git rm`) and removed from snapshot tests. This prevents redundant test maintenance and eliminates diverging verification instructions.

---

## 4. Automated Snapshot Protection Rule

**Every canonical test fixture in `tests/manual/` must be snapshotted in `tests/*Snapshot.test.ts`.**

- When adding or modifying a test note in `tests/manual/`, the corresponding automated snapshot test must be updated.
- Automated snapshot tests read the actual markdown file from disk, run it through the format converter, verify critical sanity assertions, and compare against the stored Vitest snapshot.
- If a converter change causes snapshot diffs, developers must inspect the diff to ensure changes are intentional before updating snapshots with `npm test -- -u`.

---

## 5. Language & Privacy Policy (Strict Mandate)

To maintain international accessibility, professional quality, and strict confidentiality, all contributors and AI agents must adhere to the following rules:

### Primary Language: English
- All code comments, docstrings, identifier names, commit messages, pull request titles/descriptions, and documentation files must be written in **English**.

### Permitted CJK / Japanese Usage
Japanese (CJK characters) is strictly permitted under only two specific conditions:
1. **Full-Width Character & Font Alignment Verification**:
   - Testing multi-byte string width calculations (`wcwidth` / `stringWidth`), line wrapping, or monospace column alignment in Markdown tables (e.g., `tests/manual/slack-comprehensive-test.md` Pattern C).
2. **Dedicated Localization & Translation**:
   - Secondary language translations of primary documentation (e.g. `README.ja.md`).

### Zero Personal Data Mandate
- **No Real Names or Identifiers**: Never include real personal names, user handles, real email addresses, or specific individual/corporate identifiers anywhere in:
  - Markdown test fixtures
  - Test suites or comments
  - Source code or documentation
  - Git commit messages or commit history
- **Generic Terminology**: Always use generic, neutral technical or business placeholders:
  - English: `Task A`, `Feature X`, `Component B`, `Alice`, `Bob`
  - Japanese (when used for CJK tests): `項目名`, `進捗状況`, `優先度`, `基本設計`, `完了`, `高`, `中`, `低`
