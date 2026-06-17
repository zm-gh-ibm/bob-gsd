# Archive the Prior Phase's CONTEXT.md Before Overwriting

`.gsd/CONTEXT.md` holds the implementation decisions for the **current** phase only.
Each new planning pass overwrites it — which destroys the previous phase's rationale
(its `D-{n}.x` decisions, risks, and out-of-scope notes). That history is valuable:
future phases and audits need to know *why* earlier choices were made.

## Before writing a new CONTEXT.md

At the very start of planning, **before** you overwrite `.gsd/CONTEXT.md`:

1. Read the existing `.gsd/CONTEXT.md` and note the phase number it documents (the
   `**Phase:** {n}` header).
2. If that phase number is **different** from the phase you are about to plan, archive
   it first:
   - Ensure the directory `.gsd/phases/{n}/` exists (create it if needed).
   - Copy the existing `.gsd/CONTEXT.md` to `.gsd/phases/{n}/CONTEXT.md`.
   - Do NOT overwrite an existing archive — if `.gsd/phases/{n}/CONTEXT.md` already
     exists, leave it (it was archived on a prior run) and proceed.
3. Only then write the new plan to `.gsd/CONTEXT.md` for the current phase.

## Notes

- This makes CONTEXT non-destructive without changing the Executor's contract: the
  Executor still reads the live `.gsd/CONTEXT.md` for the current phase only.
- The archive is the per-phase decision record. When a later phase needs a past
  decision, read `.gsd/phases/{n}/CONTEXT.md` rather than reconstructing it from memory.
- If you are re-planning the **same** phase (e.g., after a scope change), do not
  archive — you are revising the current phase's context in place.
