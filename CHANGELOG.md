# Changelog

All notable changes to this package. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

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

[Unreleased]: https://github.com/qw2007/dsh-incident-journal/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/qw2007/dsh-incident-journal/releases/tag/v0.1.0
