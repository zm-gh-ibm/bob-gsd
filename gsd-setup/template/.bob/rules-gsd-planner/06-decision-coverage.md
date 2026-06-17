# Decision-Coverage Gate — Every Decision Maps to a Task

Implementation decisions recorded in `.planning/CONTEXT.md` are numbered (`D-{phase}.1`,
`D-{phase}.2`, …). A decision that no task implements is a decision that will silently
not happen. Before presenting the plan for approval, prove coverage.

## Self-check before the approval gate

1. Enumerate every numbered decision `D-x.y` in the CONTEXT.md you just wrote.
2. For each decision, confirm at least one task in the Task List implements or honors
   it. Add a brief `(covers: D-x.y)` annotation to the relevant task, or maintain a
   short "Decision → Task" coverage table at the bottom of CONTEXT.md.
3. If any decision has **no** implementing task, the plan is incomplete. Either:
   - add the missing task, or
   - if the decision needs no implementation work this phase (e.g., a naming
     convention), mark it explicitly `(no task — convention only)` so the omission is
     deliberate and visible, not accidental.

## Hard rule

Do NOT present the plan at the approval gate while any `D-x.y` is uncovered and
unexplained. An uncovered decision is the most common way a "shipped" phase quietly
fails to deliver what was agreed. Surface the coverage table to the user as part of the
plan so they can confirm nothing was dropped.
