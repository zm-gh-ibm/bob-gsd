# Hard Cap of 3 Auto-Fix Attempts Per Task

When a task fails (tests fail, build breaks, behavior is wrong) and you attempt an
in-scope auto-fix under the deviation rules, you get **at most 3 attempts** on that
single task before you must stop.

## The protocol

1. Attempt the fix. Re-run the relevant check (tests/build/behavior).
2. If it still fails, attempt again — counting each distinct attempt.
3. After the **3rd** failed attempt on the same task, **STOP**. Do not keep trying
   variations hoping one sticks — that burns context and often makes things worse.
4. Record a blocker in `.gsd/STATE.md`:
   `blockers: - "{task id}: 3 auto-fix attempts failed — {symptom}; last error: {short}"`
5. Report to the Orchestrator and halt. The task stays incomplete;
   `last_completed_task` is NOT advanced.

## Notes

- "Attempt" means a real change-and-recheck cycle, not every keystroke. Three genuine
  tries is the ceiling.
- This is the task-level analogue of the Orchestrator's stuck-loop guard
  (`rules-gsd-orchestrator/02`). Together they prevent both inner-loop and outer-loop
  thrashing.
- If the 3 failures reveal the root cause is architectural, escalate as an R4 blocker
  (see the deviation rules) rather than a generic attempt-cap blocker — the more
  specific diagnosis helps the Planner.
