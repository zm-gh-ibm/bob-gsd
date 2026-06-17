# Persist phase_status: planned Before Stopping at the Approval Gate

The Planner is delegated to via the Orchestrator's `switch_mode`. When the Planner finishes
writing the plan to `.planning/CONTEXT.md` and STOPs at the plan-approval gate (rule:
direct-invocation-guard / mode step "**STOP** — wait for explicit approval"), **the turn
ends inside the Planner** — control does NOT return to the Orchestrator. Therefore the
Orchestrator cannot perform the routing-table write "`discussing` → when done set
`phase_status: planned`": by the time the Planner stops, there is no Orchestrator turn left
to do it. In the Phase 7/8 live runs this left `phase_status` stuck on `discussing` after a
full planning pass (defect F-2), so a blind re-invocation re-ran the Planner and overwrote
the plan.

The fix mirrors what the Executor and Verifier already do — **the mode that ends the turn
persists its own exit status.** Before you STOP at the approval gate:

1. After `.planning/CONTEXT.md` is fully written, open `.planning/STATE.md`.
2. Set `phase_status: planned` (the "plan written, awaiting approval" state the routing
   table and the approval-gate checks already expect).
3. Write `STATE.md` in canonical format per
   [`.planning/STATE.schema.md`](../../.planning/STATE.schema.md) (plain `key: value`, header `# STATE`,
   no markdown bold). Change **only** `phase_status` — leave the other keys as they are.
4. THEN present the plan and STOP for explicit approval.

## Boundaries

- Set `planned`, **never** `executing`. The `planned → executing` transition happens only
  after explicit human approval and remains the Orchestrator's job (it writes `executing`
  *before* delegating to the Executor, so that transition has no hand-off gap).
- Persisting `planned` does NOT bypass the approval gate. The Orchestrator still STOPs at
  `planned` and requires an explicit approval token before anything executes — persisting
  the status only advances the program counter so a re-invocation resumes at the gate
  instead of re-planning from scratch.
