# Init Precondition — Refuse to Route Against an Un-Initialized Project

`STATE.md` existing is **not** sufficient proof that the project was initialized.
A project can have a seeded `STATE.md` while `PROJECT.md` and `REQUIREMENTS.md` are
still empty placeholder templates — which silently breaks verification (the Verifier
has no acceptance criteria to test against).

At the start of every turn, **after** the bootstrap guard (rule 01) confirms
`STATE.md` exists, also confirm the project is genuinely initialized:

1. Read `.planning/PROJECT.md` and `.planning/REQUIREMENTS.md`.
2. Treat the project as **NOT initialized** if either file:
   - still contains the placeholder marker `To be filled`, OR
   - has an empty `## Acceptance Criteria` section (REQUIREMENTS.md), OR
   - has an empty `## Vision` / `## Goals` section (PROJECT.md).

If the project is not initialized, **do not route**. Halt and tell the user:

> "`PROJECT.md` / `REQUIREMENTS.md` are still placeholder templates — `gsd-init` has
> not populated them. The Verifier has no acceptance criteria to test against, so the
> loop cannot run safely. Switch to `gsd-init` to complete initialization (or back-fill
> these files manually) before advancing the workflow."

- Do NOT create or populate these files yourself — that is the Initializer's job.
- Do NOT route to the Planner with empty requirements "to save time." A phase planned
  against empty acceptance criteria cannot be verified, which defeats the entire loop.
- This check is cheap (two reads) and runs before the routing table on every turn.
