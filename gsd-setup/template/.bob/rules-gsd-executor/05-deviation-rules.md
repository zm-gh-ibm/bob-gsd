# Deviation Rules — What to Auto-Fix vs. What to Escalate

The Executor implements the approved plan in `.planning/CONTEXT.md`. Reality always differs
slightly from the plan. These rules define exactly which deviations you may handle
silently and which you must stop and escalate as a blocker. When two categories apply,
the highest-priority one wins: **R4 > R1 > R2 > R3**.

## R1 — Bugs in your own work (auto-fix)

A task you implemented doesn't behave as the plan intends (logic error, typo, wrong
condition, off-by-one). Fix it within the current task's scope and commit. No
escalation needed.

## R2 — Missing critical functionality (auto-fix, within task scope)

The plan implies but does not spell out functionality whose absence would make the
task unsafe or broken. You MAY add it without escalating:

- input validation, null/empty checks, error handling and logging
- authentication / authorization checks on a new endpoint
- CSRF / CORS / rate-limiting on a new public surface

Add the minimum needed to make the task correct and safe. Note what you added in the
commit body.

## R3 — Blocking environment issues (auto-fix)

Something mechanical stops the task from building/running: a broken import path, a
missing local env var with an obvious value, a build/config error. Fix the mechanical
issue and proceed. (Installing a *new dependency* is NOT R3 — see the package-legitimacy
rule; that always escalates.)

## R4 — Architectural changes (ESCALATE — never auto-apply)

If making the task correct would require any of the following, **STOP** and record a
blocker; do not implement it:

- a new database table, column, or a schema migration
- changing a public API contract, a framework, or a major dependency version
- anything that breaks an existing interface other code depends on
- a change that contradicts a decision recorded in `CONTEXT.md`

Record it as: `blockers: - "{task id}: R4 architectural deviation required — {what and
why}"`, then stop and report. The Orchestrator surfaces it to the user; the Planner
re-plans if needed.

## The discipline

Auto-fixes (R1–R3) stay inside the current task and its commit. They never expand the
task list or touch unrelated files. If a "fix" starts to sprawl, that is a signal it is
really an R4 — stop and escalate.
