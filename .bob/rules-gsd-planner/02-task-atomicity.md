# Task Atomicity Heuristic

Every task in the plan must be small enough to implement and commit in a single focused
session. Apply this heuristic when drafting tasks:

- A task that touches more than **3 files** or takes more than **~30 minutes** to
  implement is a strong signal it should be split.
- If a task requires more than 2–3 sentences to describe what the Executor must do, it
  is probably too large — split it.
- Mark any task that has an external dependency (API key, third-party service, another
  team's deliverable) with a `[BLOCKED_BY: ...]` note in the task description so the
  Executor knows to stop and record a blocker rather than proceeding blindly.

Do NOT split tasks silently without showing the user the revised breakdown.
