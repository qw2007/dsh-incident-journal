# dsh-incident-journal

> An **engineering journal** for the DeepSeek Harness: write down the mistakes you actually made, the techniques worth keeping, and the design stances you committed to — in a form you will re-read and get quizzed on, instead of letting them rot in a chat log.

Three skills: **journal** (`incident-journal`), **review** (`incident-review`), **audit** (`incident-audit`).

---

## The problem

Most "lessons learned" notes die of three things:

1. **They are logs, not lessons.** They record what you did, never *what you believed*. Three months later there is nothing to learn from.
2. **They are never re-read.** A hundred entries, zero reviews. Notes you never revisit are notes you never wrote.
3. **They only hold mistakes.** A technique worth keeping, or a design stance you committed to, has nowhere to go — so it drains away.

The third is solved by **typing the entries**; the first two by one rule:

| kind | holds | hard filter (the counterfactual) |
|---|---|---|
| `坑` | a belief that was overturned | **what I believed**, and why |
| `技术点` | a technique worth keeping | **what I would have done without it**, and why that is wrong |
| `思想风格` | a design stance | **under what constraints** it holds, and what breaks it |

**Every entry must be able to state its counterfactual.** If it cannot, it is not accepted — "today I learned Redis" cannot say what goes wrong without it, and "they used a layered architecture" cannot say when that stops being right. **An entry with no counterfactual is a quotation, not an entry.**

Plus a **transferability** bar: if a lesson only applies to that one error message, it does not belong here.

---

## The three skills

| skill | fires when | does |
|---|---|---|
| `incident-journal` | "start recording" / "stop recording" / "flush", or something worth keeping just happened | checks the switch, judges whether it qualifies, writes the entry and syncs all three indexes |
| `incident-review` | "quiz me" | picks 5–8 entries, questions each kind differently, prioritising what you are most likely to have forgotten |
| `incident-audit` | "audit my journal" | scans for rot: broken indexes, missing counterfactuals, `[资料]` written as fact, unverifiable locations, three-kind imbalance, incidents never recorded |

---

## Install

### Option A — no install

A skill is just a directory. Copy the three skill directories into your Harness user skill dir:

```bash
mkdir -p ~/.dsh/skills
cp -r skills/incident-journal skills/incident-review skills/incident-audit ~/.dsh/skills/
```

The DSH filesystem skill provider discovers `~/.dsh/skills/<name>/SKILL.md` automatically — **no plugin, no restart** (edits hot-reload).

### Option B — as a plugin package

This package ships a Cordis provider (`lib/index.js`) that registers `skills/` into `ctx.skills`. Add it to your Harness profile's `package.json`:

```json
{
  "dependencies": {
    "dsh-incident-journal": "github:qw2007/dsh-incident-journal"
  }
}
```

The bundled `cordis.patch.yml` mounts it as one loader row.

> Not published to npm yet. Publishing now would only freeze a shape that is still moving.

Self-check, no dependencies required:

```bash
node scripts/verify-provider.mjs
```

It drives `list()` / `get()` and verifies every `references/...` path mentioned in a `SKILL.md` body actually exists on disk.

---

## Usage

### 1. Create the library, point at it, start

The layout is **fixed**:

```bash
mkdir -p my-journal/资料 my-journal/my-project/{坑,技术点,思想风格}
```

```
my-journal/
  资料/                        external reference material (interview notes, docs)
  my-project/
    坑/  技术点/  思想风格/
  README.md   career.log   REVIEW.md
```

There are no configurable paths — so **there is no config file**. Ask the agent to "start recording"; it asks once for the absolute library path (**once, ever**) and writes `~/.dsh/incident-journal.yml`:

```yaml
journal_root: /abs/path/to/my-journal
active_workspaces:
  - /abs/path/to/the/project/you/work/in
```

After that you say "start recording" once per workspace, and that workspace keeps recording until you say "**stop recording**" — across sessions.

> **While it is not started, nothing is recorded** — but not silently: if a moment would have qualified, the agent says one line, 「（journal 未启动，这次没记）」. No such line means nothing qualifying actually happened.

### 2. Write an entry

Ask the agent to record what you just hit. It:

1. checks the switch;
2. applies the per-kind counterfactual filter;
3. greps the entry's keywords against `资料/`, adding a `## 与资料的关联` section on a hit;
4. writes the entry following [`skills/incident-journal/references/skeleton.md`](skills/incident-journal/references/skeleton.md);
5. syncs all three indexes (entries / the `README.md` topic index / the `career.log` timeline).

**When the library lives outside the workspace**, entries land in `<workspace>/.incident-journal-staging/` and are flushed in one batch when you say "**落盘**" — one approval instead of one per file.

### 3. Review

Ask to be quizzed. 5–8 questions, each kind quizzed differently:

| kind | what gets tested |
|---|---|
| `坑` | what made you confident in the wrong inference |
| `技术点` | what you would have done without it, and how that breaks |
| `思想风格` | what extra condition would make the conclusion false |

Answers fold behind `<details>`, and the round is appended to `REVIEW.md` with continuing numbers.

**Entries you get wrong earn a new line in their "follow-up questions" section** — a wrong answer means the note is missing an angle, not that your memory failed.

### 4. Audit

Ask for an audit. One line per finding, sorted by severity:

```
[broken]  career.log:18 cites of-0007, but no entry defines it
[log]     坑/foo.md has no "what I believed"; 技术点/bar.md cannot say what goes wrong without it
[pollute] 技术点/baz.md writes a [资料] claim as fact
[stale]   坑/qux.md gives a line number but no symbol name
[skew]    9 entries in 坑, 0 in 技术点, 0 in 思想风格
[missed]  commit abc1234 (revert: ...) has no entry
```

---

## What qualifies

**Each kind has its own hard filter.** Full rules: [`skills/incident-journal/references/qualifying.md`](skills/incident-journal/references/qualifying.md).

- **`坑` — "I believed A, because B."** B must exist. The test: would the you of that moment have drawn the same wrong inference from that evidence? If yes, it qualifies.
- **`技术点` — "without it I would have done X, which is wrong."** There must be a concrete alternative you would actually have taken, and it must genuinely be worse.
- **`思想风格` — "it holds under these constraints, and fails when..."** Preference with no constraint does not qualify.

Shared by all three: checkable evidence, a real cost, and transferability.

**Explicitly rejected:** syntax errors, environment chores, standard practice copied from the internet, "best practices" with no numbers, design taste with no constraint.

### Three honesty rules

- Every number is tagged `[实测]` / `[推算]` / `[资料]`. **Untagged is not trusted.**
- `[资料]` must never be written as fact. Reference material is second-hand and may be wrong or stale — the form is "the source says X", not "X". **A wrong claim with a citation is more believable than one without, so the pollution here is worse.**
- The "what it is" section **quotes the error verbatim** — paraphrasing throws away the word that later turns out to matter.

---

## What an entry looks like

[`skills/incident-journal/references/examples/`](skills/incident-journal/references/examples/) has two real, redacted entries (both `坑`):

- [`misleading-error-message.md`](skills/incident-journal/references/examples/misleading-error-message.md) — an error message whose nouns name an *implementation detail*, not the business concept
- [`sentinel-value-folded-semantics.md`](skills/incident-journal/references/examples/sentinel-value-folded-semantics.md) — a field that folds several meanings into one value cannot be used for decisions

Both write "无" under `## 源码位置`: one is machine-level git config, the other a throwaway script plus an external API. **When there is no project code, do not invent a location** — faking one to fill the cell is far worse than leaving it empty.

---

## Design notes

**Why a skill and not a plugin for the automation.**

The hard part of this library is entirely judgement: what counts as a real counterfactual, whether a lesson transfers. That cannot be automated. Only the final `git add/commit/push` can.

Wrapping that in a plugin costs peer-dependency ranges, a build, a pack step, a profile install, and a restart — for zero added judgement. A skill keeps the trigger where it belongs: a human deciding whether this moment is worth recording.

(`lib/index.js` exists so the library can be **distributed** to other machines as a plugin. If you take Option A you never touch it.)

**Why all three kinds need a counterfactual.**

The counterfactual is the only thing standing between this and a log. Once entries were split into three kinds, the old rule — "must have a `wrong_belief`" — stopped covering two of them. Without an equally hard filter per kind, `技术点` turns into a bookmarks folder within three months.

**Why `status` is human-edited.** Getting a quiz question right once is not mastery.

**Why the layout is fixed.**

It used to be four configurable keys (`entries` / `index` / `timeline` / `review`). Since there is no second legal layout, that config was just the same defaults table copied into three skill bodies — so it was deleted, and with it a place for the three to drift apart.

---

## Compatibility

- DSH `>=0.1.0-rc.6` (developed and verified on `0.2.0-rc.2`)
- Option A has no dependencies; Option B needs `@deepseek-ai/cordis ^4.0.1` (peer)
- Platform-independent: no hardcoded absolute paths or platform-specific commands in any skill body.

## License

MIT — see [LICENSE](LICENSE).

The provider shim in `lib/index.js` is adapted from [`dsh-ponytail-skills`](https://github.com/gongyijie85/dsh-ponytail) (MIT), credited in the file header.
