# dsh-incident-journal

> An **engineering incident journal** for the DeepSeek Harness: write down the mistakes you actually made, in a form you will re-read and get quizzed on — instead of letting them rot in a chat log.

Three skills: **journal** (`incident-journal`), **review** (`incident-review`), **audit** (`incident-audit`).

---

## The problem

Most "lessons learned" notes die of two things:

1. **They are logs, not lessons.** They record what you did, never *what you believed*. Three months later there is nothing to learn from.
2. **They are never re-read.** A hundred entries, zero reviews. Notes you never revisit are notes you never wrote.

Two mechanisms block both:

- **A mandatory "what I believed" section, with a reason.** The valuable story is not "I fixed X" — it is "I believed X, measured Y, so I changed to Z." **An entry with no wrong belief is not accepted.**
- **A `status` field plus a quiz skill.** Every entry is `mastered` / `needs review` / `seen once`, and review targets whatever you are most likely to have forgotten.

Plus a **transferability** bar: if a lesson only applies to that one error message, it does not belong here.

---

## The three skills

| skill | fires when | does |
|---|---|---|
| `incident-journal` | you just finished debugging something | writes an entry from a fixed skeleton, syncs all three indexes |
| `incident-review` | "quiz me" | picks 5–8 entries, prioritising what you are most likely to have forgotten |
| `incident-audit` | "audit my journal" | scans for rot: broken indexes, log-shaped entries, stale numbers, repeated patterns, incidents never written down |

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

### 1. Create a journal

```bash
mkdir -p my-journal/topics my-journal/measurements
```

Optional config at the journal root, `.incident-journal.yml`:

```yaml
entries: topics/          # entry directory
index: README.md          # topic index
timeline: career.log      # one line per event
review: REVIEW.md         # quiz questions
```

Omit the file and those are the defaults.

### 2. Write an entry

Ask the agent to record what you just hit. It locates the journal root, writes an entry following [`skills/incident-journal/references/skeleton.md`](skills/incident-journal/references/skeleton.md), and syncs the three indexes.

The skeleton: **symptom** / **what I believed** / **actual cause** / **how I located it** / **fix** / **numeric evidence** / **the 30-second version** / **what a follow-up question would ask**.

### 3. Review

Ask to be quizzed. 5–8 questions, answers folded behind `<details>`, appended to `REVIEW.md` with continuing numbers.

**Entries you get wrong earn a new line in their "follow-up questions" section** — a wrong answer means the note is missing an angle, not that your memory failed.

### 4. Audit

Ask for an audit. Output is one line per finding, sorted by severity:

```
[broken]  career.log:18 cites of-0007, but no entry defines it
[log]     topics/foo.md has no "what I believed" section
[stale]   topics/bar.md marks [measured] with no evidence
[repeat]  a.md / b.md / c.md share one rule → merge them
[missed]  commit abc1234 (revert: ...) has no entry
```

---

## What qualifies

Any **one** of these is enough:

1. **A wrong belief was overturned** — wrong for a good reason, not a typo.
2. **There are checkable numbers** — command output, timings, memory, cost.
3. **It cost something** — money, data, or time if ignored.
4. **It transfers** — idempotency, replay vs side effects, container memory, event-store choice.

**Explicitly rejected:** syntax errors, environment chores, standard practice copied from the internet, "best practices" with no numbers.

Full rules: [`skills/incident-journal/references/qualifying.md`](skills/incident-journal/references/qualifying.md).

### Two honesty rules

- Numbers must be tagged `[measured]` or `[estimated]`. **`[estimated]` is allowed; untagged is not.**
- The symptom section **quotes the error verbatim** — paraphrasing throws away the word that later turns out to matter.

---

## Design notes

**Why a skill and not a plugin for the automation.**

The hard part of this library is entirely judgement: what counts as an overturned belief, whether a lesson transfers. That cannot be automated. Only the final `git add/commit/push` can.

Wrapping that in a plugin costs peer-dependency ranges, a build, a pack step, a profile install, and a restart — for zero added judgement. A skill keeps the trigger where it belongs: a human deciding whether this moment is worth recording.

(`lib/index.js` exists so the library can be **distributed** to other machines as a plugin. If you take Option A you never touch it.)

**Why `status` is human-edited.** Getting a quiz question right once is not mastery.

## Compatibility

- DSH `>=0.1.0-rc.6` (developed and verified on `0.2.0-rc.2`)
- Option A has no dependencies; Option B needs `@deepseek-ai/cordis ^4.0.1` (peer)
- Platform-independent: no hardcoded absolute paths or platform-specific commands in any skill body.

## License

MIT — see [LICENSE](LICENSE).

The provider shim in `lib/index.js` is adapted from [`dsh-ponytail-skills`](https://github.com/gongyijie85/dsh-ponytail) (MIT), credited in the file header.
