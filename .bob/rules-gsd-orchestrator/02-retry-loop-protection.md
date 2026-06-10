# Retry Loop Protection

Track how many consecutive times the Orchestrator has routed to the same mode for the
same phase without `last_completed_task` advancing.

- After **3 consecutive delegations** to the same mode with no state progress, STOP
  and surface this to the user: "The workflow appears to be stuck — phase {n} has been
  in `{status}` for {n} consecutive delegations with no task progress. Please review
  what is blocking execution and resolve it manually."
- Record this condition as a blocker in `STATE.md`: `blockers: - "stuck-loop: {status}
  for {n} consecutive turns without progress"`
- Do NOT keep looping automatically hoping for a different result.
