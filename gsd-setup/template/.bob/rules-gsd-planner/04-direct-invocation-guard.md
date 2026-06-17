# Direct Invocation: Always Re-Read STATE.md First

The Planner can be invoked directly (not only via the Orchestrator). When invoked
directly, you must re-read `.planning/STATE.md` from disk before doing anything else.

Do NOT assume:
- Which phase you are on (read `current_phase` from disk)
- That the previous plan in `.planning/CONTEXT.md` is still valid (check `phase_status`)
- That `open_decisions` are unchanged since the last session

If `phase_status` is anything other than `discussing`, stop and tell the user:
"STATE.md shows `phase_status: {status}`. The Planner should only be invoked when
`phase_status` is `discussing`. If you want to re-plan, first set `phase_status:
discussing` in STATE.md manually."
