# REQUIREMENTS.md Is the Verification Source of Truth

The Verifier's job is to test the phase output against the acceptance criteria in
`.gsd/REQUIREMENTS.md`. Those criteria are the contract. If they are missing, there is
nothing to verify against — and a "pass" would be meaningless.

## Hard gate before verifying

1. Load `.gsd/REQUIREMENTS.md` and identify the acceptance criteria scoped to the
   current phase (by phase number, feature name, or explicit `[Phase N]` tag).
2. If `REQUIREMENTS.md` still contains the placeholder marker `To be filled`, or its
   `## Acceptance Criteria` section is empty, **STOP**. Do not verify. Record a blocker
   and report to the Orchestrator:
   > "Cannot verify Phase {n}: REQUIREMENTS.md has no acceptance criteria. The phase
   > output has nothing to be tested against. Run `gsd-init` or back-fill
   > REQUIREMENTS.md before verification can proceed."
3. If `REQUIREMENTS.md` is populated but **no** criterion maps to the current phase,
   do not silently fall back to ROADMAP exit-criteria. Record this as a FAIL with the
   note "no acceptance criteria scoped to this phase" so the gap is visible, and surface
   it to the user.

## Why this rule exists

ROADMAP exit-criteria describe *what a phase builds*; REQUIREMENTS acceptance criteria
describe *how we prove it works*. They are not interchangeable. Verifying against the
ROADMAP only confirms "something was built," not "it meets the contract." Always anchor
PASS/FAIL judgments to REQUIREMENTS.md criteria, citing the specific criterion ID/text
in each result row of `VERIFY.md`.
