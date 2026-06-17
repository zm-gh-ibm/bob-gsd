# STATE.md — Canonical Schema

This is the single normative reference for the on-disk format of `.planning/STATE.md`, the
program counter for the GSD state machine. Every mode that writes `STATE.md`
(`gsd-init`, `gsd-orchestrator`, `gsd-executor`, `gsd-shipper`) MUST conform to this
format exactly. The deterministic loop scripts (`scripts/run-unattended.{ps1,bat}`)
parse `STATE.md` with `^phase_status:` / `findstr /b` style matchers, so any deviation
from plain `key: value` lines silently breaks termination and blocker detection.

## Canonical format

```
# STATE
milestone: {id}
current_phase: {n}
phase_status: {discussing | planned | executing | verifying | shipped | milestone-complete}
last_completed_task: {task id or "none"}
open_decisions:
  - {text, or "none"}
blockers: {none}
```

## Rules (normative)

1. **Header.** The first line is exactly `# STATE`. Never `# GSD Workflow State` or any
   other heading.
2. **Plain keys — no markdown bold.** Each scalar key is written as `key: value` on its
   own line. NEVER `**phase_status:** discussing` or any bold/emphasis decoration — the
   parsers anchor on the bare key at line start and a `**`-prefixed line will not match.
3. **`phase_status`** is always a single-line scalar and must be one of the six values
   above. `milestone-complete` is the ONLY accepted terminal state (the loop exits 0 on
   it). `shipped` means a phase shipped but the milestone is not yet done.
4. **`last_completed_task`** is a single-line scalar: a task id (e.g. `8.4`) or `none`.
5. **`open_decisions`** is ALWAYS a YAML list (`open_decisions:` followed by one or more
   `  - …` items). When there are none, write a single `  - none` item.
6. **`blockers`** is EITHER:
   - the literal single line `blockers: none` (no blocker), OR
   - a YAML list (a blocker is present):
     ```
     blockers:
       - "task-id: description"
     ```
   The cleared form is always the single line `blockers: none`. See
   `.bob/rules-gsd-orchestrator/05-persist-phase-status.md` and the loop scripts'
   tolerant blocker parsing.

## Writer / reader contract

- **Writers are schema-strict:** emit exactly this format, every time.
- **Readers are schema-tolerant:** the loop scripts must detect a blocker in *either*
  the inline (`blockers: <text>`) or list (`blockers:` + `  - "…"`) form, and must treat
  a bare `blockers:` line with no non-`none` value as a clear. `phase_status` is always
  single-line and read with a line-start key matcher.
