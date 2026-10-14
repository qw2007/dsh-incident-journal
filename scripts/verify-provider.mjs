#!/usr/bin/env node
// Verify this package's skill provider without booting the Harness.
//
// Drives lib/index.js the same way the DSH skill registry does — list() then
// get() — and additionally checks the things the registry does not: that every
// relative reference inside a SKILL.md resolves on disk, that dsh.plugin.json
// advertises exactly the skills the provider discovers, and that each
// frontmatter block survives a real YAML parser.
//
// Run: node scripts/verify-provider.mjs
import { readFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

import plugin, { apply, name, inject } from '../lib/index.js'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const failures = []
const notes = []

function check(condition, message) {
  if (condition) return true
  failures.push(message)
  return false
}

// --- 1. Module shape ---------------------------------------------------------
check(name === 'dsh-incident-journal', `exported name is "${name}"`)
check(Array.isArray(inject) && inject.includes('skills'), 'inject must include "skills"')
check(typeof apply === 'function', 'apply must be a function')
check(plugin.name === name, 'default export and named export disagree on name')

// --- 2. Drive the provider ---------------------------------------------------
let captured = null
const fakeCtx = {
  skills: {
    registerProvider(factory) {
      captured = factory({})
    }
  }
}
apply(fakeCtx)
check(captured !== null, 'apply() did not call ctx.skills.registerProvider()')
if (captured === null) {
  report()
}

check(captured.name === 'incident-journal', `provider name is "${captured.name}"`)

const candidates = await captured.list({})
const discovered = candidates.map((c) => c.name).sort()
const expected = ['incident-audit', 'incident-journal', 'incident-resource', 'incident-review']

check(
  JSON.stringify(discovered) === JSON.stringify(expected),
  `discovered ${JSON.stringify(discovered)} != ${JSON.stringify(expected)}`
)

for (const candidate of candidates) {
  const label = candidate.name || '(unnamed)'
  check(candidate.name !== '', `${label}: frontmatter is missing "name"`)
  check(candidate.description !== '', `${label}: frontmatter is missing "description"`)
  check(candidate.rank === 550, `${label}: rank is ${candidate.rank}, expected 550`)
  check(candidate.source === 'custom', `${label}: source is ${candidate.source}, expected "custom"`)
  check(candidate.provider === 'incident-journal', `${label}: provider is ${candidate.provider}`)
  check(candidate.invocation.modelInvocable === true, `${label}: should be model-invocable`)
}

// --- 3. get() returns a full definition with a directory resource base -------
for (const candidate of candidates) {
  const definition = await captured.get(candidate, {})
  const label = candidate.name
  check(definition !== undefined, `${label}: get() returned undefined`)
  if (definition === undefined) continue
  check(
    (definition.content ?? '').trim().length > 0,
    `${label}: get() returned an empty body`
  )
  check(
    definition.resourceBase?.kind === 'directory',
    `${label}: resourceBase.kind is "${definition.resourceBase?.kind}", expected "directory"`
  )
  check(
    definition.resourceBase?.path === candidate.locator,
    `${label}: resourceBase.path does not point at the skill directory`
  )

  // --- 4. Relative references inside the body must resolve on disk ----------
  const body = definition.content ?? ''
  const refs = new Set(
    [...body.matchAll(/`((?:\.\.?\/)?[A-Za-z0-9._/-]*references\/[A-Za-z0-9._/-]+)`/g)].map(
      (m) => m[1]
    )
  )
  for (const rel of refs) {
    const target = resolve(candidate.locator, rel)
    const ok = await access(target).then(() => true, () => false)
    check(ok, `${label}: body references "${rel}" but ${target} does not exist`)
  }
  notes.push(
    `${label.padEnd(18)} ${String(refs.size).padStart(2)} ref(s)  ${candidate.path.replace(pkgRoot + '\\', '').replace(pkgRoot + '/', '')}`
  )
}

// --- 5. dsh.plugin.json must advertise exactly what we discover --------------
const manifest = JSON.parse(await readFile(join(pkgRoot, 'dsh.plugin.json'), 'utf8'))
const advertised = [...(manifest.contributes?.skills ?? [])].sort()
check(
  JSON.stringify(advertised) === JSON.stringify(discovered),
  `dsh.plugin.json advertises ${JSON.stringify(advertised)} != ${JSON.stringify(discovered)}`
)
check(manifest.main === './lib/index.js', `dsh.plugin.json main is "${manifest.main}"`)

// --- 6. Frontmatter must survive a real YAML parser --------------------------
// The host reads SKILL.md frontmatter with the `yaml` package, NOT with the
// tolerant line parser in lib/index.js. An unquoted plain scalar containing
// ": " (or " #") parses as a nested mapping; the host's parse then fails and
// the skill is dropped from the catalog with no error, while the shim here
// still accepts it. That mismatch is how this bug ships — so check it here.
// Any description that needs a colon goes in a folded block: `description: >`.
for (const candidate of candidates) {
  const label = candidate.name
  const text = await readFile(candidate.path, 'utf8')
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!check(block !== null, `${label}: no YAML frontmatter block`)) continue
  for (const [index, raw] of block[1].split('\n').entries()) {
    if (/^[ \t]/.test(raw)) continue // block-scalar continuation line
    const match = /^([A-Za-z][\w-]*):[ \t]*(.*)$/.exec(raw.trimEnd())
    if (match === null) continue
    const key = match[1]
    const value = match[2].trim()
    if (value === '' || value.startsWith('>') || value.startsWith('|')) continue
    if (value.startsWith('"') || value.startsWith("'")) continue
    const line = index + 2 // block[1] starts on file line 2
    check(
      !/:[ \t]/.test(value),
      `${label}: frontmatter "${key}" (line ${line}) is an unquoted scalar containing ": " — ` +
        `a real YAML parser reads that as a nested mapping and the host silently drops this ` +
        `skill. Use a folded block: "${key}: >".`
    )
    check(
      !/[ \t]#/.test(value),
      `${label}: frontmatter "${key}" (line ${line}) is an unquoted scalar containing " #" — ` +
        `quote it or use a folded block: "${key}: >".`
    )
  }
}

report()

function report() {
  for (const note of notes) console.log(`  ok  ${note}`)
  if (failures.length === 0) {
    console.log(`\nPASS  ${discovered.length} skills, all references resolve, frontmatter is YAML-safe.`)
    process.exit(0)
  }
  console.error(`\nFAIL  ${failures.length} problem(s):`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
