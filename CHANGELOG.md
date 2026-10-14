# Changelog

All notable changes to this package. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **The `of-NNNN` declaration rule is now in both READMEs.** The four indexes
  cite entries by number, so the number has to be declared inside the entry
  file — either on the identity line (one entry per file) or in a `## of-NNNN`
  section (several entries per file).
- **Option B now documents what actually injects, and how.** The old text told
  you to hand-edit the profile's `package.json` and install from there — which
  is exactly what this harness forbids. It now says to clone the repo, hand the
  directory to `plugin_manager`'s `install_bundle`, and leave the profile files
  to that action; plus what `lib/index.js`, `dsh.plugin.json` and
  `cordis.patch.yml` each do, and what installing costs.
- **Both READMEs now state which copy actually wins when A and B coexist.** The
  registry sorts candidates by rank ascending and keeps the first of each name,
  so a *smaller* rank wins: user copies (`~/.dsh/skills`, rank 400) outrank a
  packaged provider (550), which outranks dsh's bundled skills (600). Installing
  the bundle while keeping the Option A copies therefore leaves the copies in
  effect and the packaged ones silently ignored, with one warning line in the
  log. Documented so the two options are not mistaken for additive.

### Fixed

- **`dsh.plugin.json` was left at 0.1.0.** Its `version` and `description` had
  not moved with `package.json` since 0.2.0, so an installed copy advertised a
  release that no longer existed.
- **Both READMEs contradicted themselves on the index count.** The skill table
  said `incident-journal` syncs three indexes while the usage section said
  four. Four is correct: root `README.md`, `career.log`, `REVIEW.md`, and the
  project view.
- **The audit example carried a stale `[断链]` / `[broken]` line** — the
  pre-0.2.0 wording ("no entry defines it") instead of the current one
  ("neither the identity line nor a `## of-NNNN` section declares it") — and
  omitted `[重复]` / `[duplicate]` entirely.

## [0.2.0] — 2026-10-13

Three kinds of entry, an explicit on/off switch, and a fixed journal layout.

### Changed — breaking

- **Entries are now typed:** `坑` (a disproven belief) / `技术点` (a technique
  worth keeping) / `思想风格` (a design stance). One rule covers all three —
  **an entry must state its counterfactual:** what I believed (坑), what I
  would have done without it (技术点), under what constraints it holds
  (思想风格). No counterfactual means it is a quotation, not an entry.
- **The journal layout is fixed and split by kind:** `<root>/资料/`; `坑` under
  `<root>/<project>/坑/` because it is bound to one project's code;
  `技术点/` and `思想风格/` at the **root**, shared across projects and tied
  back by a `projects:` line in each entry; `README.md` / `career.log` /
  `REVIEW.md` at the root, plus a link-only `<root>/<project>/README.md` as that
  project's view. `坑` travels with the project, the other two travel with you.
  The optional `<root>/.incident-journal.yml` is gone — the paths it configured
  are no longer configurable.
- **Thickening is now a rule with a mechanism.** Before writing, grep the
  library for a matching entry; if one exists and the new judgement exposes
  something it did not account for, add it to that entry instead of creating a
  second file. The boundary: once it would require changing the title, it is a
  different thing — create a new entry. `坑` never thickens, because it is bound
  to one project's code location; the same `坑` recurring across three or more
  projects is what `incident-audit` promotes into a single `技术点` /
  `思想风格`.
- **Source locations are clues, not links.** The library and the code live in
  separate repositories, so line numbers drift and symbol names disappear —
  that is normal, not rot. `repo` / `commit` are required when the two are
  separate; write "未知" tagged `[推算]` rather than invent a plausible-looking
  sha.
- **`incident-journal` writes four indexes** now: the root `README.md`,
  `career.log`, `REVIEW.md`, and the project's own `<project>/README.md`.
- **The library is located through `~/.dsh/incident-journal.yml`**
  (`journal_root` + `active_workspaces`) instead of by walking up for a marker
  file.
- The skeleton is now kind-dependent: five shared sections, plus a
  counterfactual section and a mechanism section whose names differ per kind.
  `源码位置` is required **only when project code is involved** — say "无"
  rather than invent a location to fill the cell.
- `[资料]` joins `[实测]` / `[推算]` as a required tag for anything that came
  from `资料/` rather than from your own measurement, and must never be written
  as fact.

### Added

- **Start / stop.** Journaling is off by default. `开始记录` turns it on for the
  current workspace and it stays on across sessions until `停止记录`. A moment
  that would have qualified while inactive yields exactly one line —
  「（journal 未启动，这次没记）」 — so the miss is visible instead of silent.
- **`资料/` integration.** Before writing, the entry's keywords are grepped
  against `<root>/资料/`; a hit adds a `## 与资料的关联` section naming the
  file, the line, and whether the reference agrees with your measurement.
- `incident-review` questions by kind (locate the cause / imagine life without
  it / find the constraint boundary) and tries to cover all three per round.
- `incident-audit` grows from five checks to eight, adding: missing
  counterfactual per kind, `[资料]` written as fact, unverifiable source
  locations, and three-kind imbalance.
- **`of-NNNN` numbers must be declared inside the entry file** — on the
  identity line (`kind · of-0007 · status`) for a one-instance file, or as a
  `## of-NNNN` heading for a multi-instance one. An index that cites a number no
  file declares is a dangling reference; `incident-audit` check 1 now resolves
  numbers against both positions and reports `[断链]`. Single-instance files are
  the ones that break silently: their H2s are taken by the semantic sections, so
  the number only ever exists in the index.

### Fixed

- `incident-journal` vanished from the skill catalog after the 0.2.0
  description rewrite. The frontmatter kept a plain single-line scalar and the
  new wording contained `just happened: a belief ...`; the host reads
  frontmatter with a real YAML parser, which treats `": "` inside a plain
  scalar as a nested mapping, so parsing failed and the host dropped the skill
  **with no error**. All three descriptions now use folded blocks
  (`description: >`), and `verify-provider.mjs` gained a check for YAML-unsafe
  plain scalars so the next one fails loudly instead of disappearing.

## [0.1.0] — 2026-10-12

First public cut. Three skills and the provider shim that distributes them.

### Added

- **`incident-journal`** — writes one entry from a fixed eight-section
  skeleton: symptom / what I believed / actual cause / how I located it / fix /
  numeric evidence / the 30-second version / follow-up questions. Refuses to
  write an entry with no wrong belief. Syncs the entry directory, topic index
  and timeline together.
  - `references/qualifying.md` — the four inclusion rules, the explicit
    rejection list, and the boundary cases ("I found out later" does not
    count; the third instance of one pattern means fix the rule, not add
    an entry).
  - `references/skeleton.md` — the section-by-section writing requirements.
  - `references/examples/misleading-error-message.md` — worked example: an
    error message that names an *implementation detail* rather than the
    business concept (`SEC_E_NO_CREDENTIALS` pointing at the TLS backend
    instead of credentials).
  - `references/examples/sentinel-value-folded-semantics.md` — worked example:
    a field that folds several meanings into one value cannot be used for
    decisions (`IndexOf` → `-1`, `license.spdx_id` → `NOASSERTION`).
- **`incident-review`** — quizzes you on your own journal. Selection order is
  `seen once` → stalest `needs review` → a transfer variant. 5–8 questions per
  round, answers folded behind `<details>`. A wrong answer appends a line to
  that entry's follow-up section.
- **`incident-audit`** — read-only health check across five dimensions: index
  tri-linkage, missing wrong beliefs, numeric decay, repeated patterns (the
  same rule appearing three or more times is a bug in the *rule*), and
  incidents that were never recorded.
- `lib/index.js` — Cordis plugin registering one skill provider on
  `ctx.skills`, adapted from `dsh-ponytail-skills` (MIT). Resolves skill
  bodies from `import.meta.url` and returns a directory `resourceBase`, so a
  `SKILL.md` can reference sibling files under `references/`.
- `scripts/verify-provider.mjs` — dependency-free self-check that drives
  `list()` / `get()` and validates that every `references/...` path named in a
  skill body exists, and that `dsh.plugin.json` advertises exactly the skills
  the provider discovers.

### Notes

- Not published to npm.
- Verified against DSH `0.2.0-rc.2`; declares `engines.dsh >= 0.1.0-rc.6`.

[Unreleased]: https://github.com/qw2007/dsh-incident-journal/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/qw2007/dsh-incident-journal/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/qw2007/dsh-incident-journal/releases/tag/v0.1.0
