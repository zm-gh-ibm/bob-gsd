# Seed STATE.md Exactly Per the Canonical Schema

When `gsd-init` creates `.planning/STATE.md`, it MUST write the file **exactly** in the
canonical format defined in [`.planning/STATE.schema.md`](../../.planning/STATE.schema.md). The
loop scripts (`scripts/run-unattended.{ps1,bat}`) parse `STATE.md` with line-start key
matchers (`^phase_status:`, `findstr /b "blockers:"`); any cosmetic deviation silently
breaks termination and blocker detection.

## Hard requirements

- The first line is exactly `# STATE`. **Never** `# GSD Workflow State` or any other
  heading.
- Every scalar key is a plain `key: value` line. **Never** markdown-bold keys such as
  `**phase_status:** discussing` — the parsers anchor on the bare key and a `**`-prefixed
  line will not match.
- `open_decisions` is always a YAML list (use a single `  - none` item when empty).
- `blockers` is the literal line `blockers: none` at init time (a fresh project has no
  blocker).

## Canonical seed (initial values)

```
# STATE
milestone: {milestone-id}
current_phase: 1
phase_status: discussing
last_completed_task: none
open_decisions:
  - none
blockers: none
```

This pins the format at the source. If you ever find yourself decorating a key with
bold, an alternate header, or inlining `open_decisions` — stop and re-read
`.planning/STATE.schema.md`. All downstream writers (orchestrator, executor, shipper)
conform to the same schema.
