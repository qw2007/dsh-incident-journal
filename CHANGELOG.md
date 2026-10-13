# Changelog

All notable changes to this package. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [0.2.0] — 2026-10-13

Three kinds of entry, an explicit on/off switch, and a fixed journal layout.

### Changed — breaking

- **Entries are now typed:** `坑` (a disproven belief) / `技术点` (a technique
  worth keeping) / `思想风格` (a design stance). One rule covers all three —
  **an entry must state its counterfactual:** what I believed (坑), what I
  would have done without it (技术点), under what constraints it holds
  (思想风格). No counterfactual means it is a quotation, not an entry.
- **The journal layout is fixed:** `<root>/资料/`,
  `<root>/<project>/{坑,技术点,思想风格}/`, and `README.md` / `career.log` /
  `REVIEW.md` at the root. The optional `<root>/.incident-journal.yml` is gone —
  the paths it configured are no longer configurable.
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
