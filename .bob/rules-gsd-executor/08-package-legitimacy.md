# Package Legitimacy — Verify Before Installing, Escalate Unknowns

Installing a dependency is never a silent auto-fix. A hallucinated or malicious package
is one of the highest-impact failure modes in agentic coding. This rule governs every
`npm install`, `pip install`, `cargo add`, `go get`, etc.

## Before any install

1. **Honor the plan's classification** (from the Planner's package-legitimacy rule):
   - `[OK]` — proceed, but still confirm the exact package name matches the plan.
   - `[SUS]` — verify the package is real and correct **before** installing: check it
     resolves on the official registry, that the name is exact (watch for typo-squats),
     and that it is reasonably maintained. If verification fails, treat as `[SLOP]`.
   - `[SLOP]` — do NOT install. Stop.
2. **Any dependency not listed in the plan** is by definition out of scope. Adding a
   new dependency is an R4-class change — **STOP and escalate** as a blocker rather than
   installing it on your own initiative:
   `blockers: - "{task id}: task needs unplanned dependency {name} — escalating for approval"`.

## Hard rules

- Installing a package is explicitly **excluded** from the auto-fix deviation rules
  (R1–R3). It always requires either a plan classification of `[OK]`/verified-`[SUS]`,
  or escalation.
- Never install a package whose name you cannot verify resolves to the intended,
  legitimate project.
- Pin to the version the plan specifies; if the plan gives none, record the version you
  installed in the commit body so it is auditable.

When in doubt, stop and ask. A missing dependency is a recoverable blocker; a malicious
one installed silently is not.
