# Run Tests After Every Commit

After each atomic commit, run the project's test suite (as documented in
`.planning/PROJECT.md` or detected from the repo: `npm test`, `pytest`, `go test ./...`,
etc.).

- If tests pass: update `last_completed_task` in `STATE.md` and proceed to the next
  task.
- If tests fail: **stop immediately**. Do NOT proceed to the next task. Record a
  blocker in `STATE.md`: `blockers: - "{task_id}: tests failed after commit — see
  output above"`. Report the failure output to the user and halt.

This prevents a cascade where multiple tasks build on a broken foundation.

> Exception: if the project has no test suite (documented in PROJECT.md), skip this
> rule and note "no test suite" in the task's commit message body.
