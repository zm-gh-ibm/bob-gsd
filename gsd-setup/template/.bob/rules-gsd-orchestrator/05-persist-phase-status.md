# Persist phase_status Before Ending the Turn

The Orchestrator is the program counter. After it delegates to a sub-mode, the resulting
`phase_status` MUST be written to `.planning/STATE.md` **before the turn ends**. If you delegate
but leave `phase_status` on the sub-mode's *input* value, the counter never advances — and
a blind re-invocation (which is exactly how the unattended loop drives you) re-runs the
sub-mode you just finished, spinning instead of progressing.

This was defect F-2 in the Phase 7/8 live runs: the Planner returned but `phase_status` was
still `discussing`. The mechanical cause: the Orchestrator delegates via `switch_mode`, and
when the sub-mode ends its turn with `attempt_completion` (e.g. the Planner STOPping at the
approval gate), **control does not return to the Orchestrator** — so any "after the sub-mode
returns, write phase_status" step can never run.

## Division of responsibility (who persists what)

Because of the `switch_mode` hand-off, the actor that **ends the turn** must persist the
status. Two cases:

**A. Sub-mode ends the turn → the sub-mode self-persists its own exit status.** This is the
pattern the Executor (sets `phase_status: verifying` when all tasks are done), the Verifier
(leaves `verifying` on a clean pass, sets `executing` on failures), and now the Planner
(sets `phase_status: planned` before the approval gate — see
`.bob/rules-gsd-planner/08-persist-planned-status.md`) already follow. The Orchestrator does
NOT need to (and cannot) re-write these after the fact.

**B. Orchestrator writes a transition *before* delegating → no hand-off gap.** These the
Orchestrator owns directly, writing `STATE.md` first and then `switch_mode`:

| Situation | Orchestrator writes `phase_status:` | then delegates to |
|---|---|---|
| `planned` + explicit user approval | `executing` | `gsd-executor` |
| `verifying` + clean (all PASS in VERIFY.md) | (route — Shipper sets `shipped`) | `gsd-shipper` |
| `shipped` + more phases remain | `discussing` (and advance `current_phase`) | next phase's Planner |

Never leave `phase_status` on a just-completed sub-mode's *input* status. If you ever find
the counter has not advanced after a sub-mode ran (e.g. still `discussing` after a plan was
written), that sub-mode failed to self-persist — fix it at the sub-mode (case A), not by
trying to re-enter from the Orchestrator.

## Always emit the route-transparency trace

The single-line route-transparency trace (rule 03) is printed **before** delegation on every
routing turn — never skip it. When the transition is a case-B Orchestrator write, perform that
`STATE.md` write before `switch_mode`. When it is a case-A hand-off, the trace is the
Orchestrator's last act and the sub-mode persists the status itself.

## Format

Write `STATE.md` in the canonical format defined in
[`.planning/STATE.schema.md`](../../.planning/STATE.schema.md): plain `key: value` lines (no markdown
bold), header exactly `# STATE`. `phase_status` is always a single-line scalar.
