# Completeness Check Before Starting Verification

Before evaluating any individual acceptance criterion, verify that all tasks in the
current phase plan have been completed:

1. Load `.planning/CONTEXT.md` — collect the full ordered task list for the current phase.
2. Compare against `last_completed_task` in `.planning/STATE.md`.
3. If `last_completed_task` does not match the final task in the plan, the phase is
   **not ready to verify**. Stop immediately and report to the Orchestrator:
   "Phase {n} is incomplete — last completed task is {id}, but the plan contains tasks
   up to {final_id}. Set phase_status: executing and route back to the Executor."
4. Only proceed with verification if all plan tasks are accounted for.
