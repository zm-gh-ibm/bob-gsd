# Package Legitimacy — Flag Dependencies During Planning

AI-generated plans sometimes reference packages that do not exist, are abandoned, or
are typo-squats of real ones ("slop"). Catching this at planning time is far cheaper
than discovering it mid-execution.

## When a plan introduces a new dependency

For every new third-party package the plan would add (npm, pip, cargo, go get, etc.),
classify it in CONTEXT.md:

- **`[OK]`** — well-known, actively maintained, you are confident it exists with that
  exact name. No action needed.
- **`[SUS]`** — plausible but unverified: you are not certain of the exact package
  name, its maintenance status, or that it is the right one. Mark it and add a note:
  the Executor must verify it before installing.
- **`[SLOP]`** — likely does not exist or is the wrong/abandoned package. Do NOT plan
  around it. Find a real alternative or solve the problem without the dependency.

## Rules

- List all new dependencies with their classification in a "Dependencies" section of
  CONTEXT.md, so the Executor and the user see them before approval.
- Never plan a task whose only solution is a `[SLOP]` package.
- Any `[SUS]` package becomes a verification step the Executor must clear (see the
  Executor's package-legitimacy rule) before the install — it is not a free action.
- Prefer the standard library or an already-present dependency over adding a new one
  whenever practical; note the trade-off if you add one.
