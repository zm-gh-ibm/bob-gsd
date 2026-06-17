# Stub Scan — Fail Verification When Work Is Faked, Not Done

Code can pass a thin test suite while being hollow: a function that `return []`s instead
of querying, a handler that swallows everything, a `TODO` where the real logic belongs.
The Verifier must actively look for these before declaring a phase clean.

## Scan as part of every verification

For the files changed in the current phase (use `git diff` against the phase start to
scope it), scan for stub/placeholder signatures:

- empty or trivial returns standing in for real logic: `return []`, `return {}`,
  `return ""`, `return None`, `return null`, `return true` with no computation
- `TODO`, `FIXME`, `XXX`, `HACK`, "not implemented", "placeholder", "stub"
- raised/thrown "not implemented": `NotImplementedError`, `throw new Error('not implemented')`
- bare `pass` / empty function bodies where behavior is required
- hard-coded values that should be computed or fetched (a faked "happy path")

## Judgment, not just grep

A match is not automatically a failure — some stubs are legitimately out of scope for
the phase. Apply this test for each finding:

- **Does the stub defeat an acceptance criterion or the phase goal?** If yes → record a
  **FAIL** with the file, line, and which criterion it undermines, and write a concrete
  fix plan for the Executor.
- If the stub is genuinely out of scope (e.g., a later-phase feature), note it under
  verification notes as an accepted stub — do not fail on it, but make it visible.

## Why

"All tests passed" is necessary, not sufficient. A phase that ships hollow code looks
done and isn't — and the cost surfaces phases later. The stub scan is what turns the
Verifier from a test-runner into an actual acceptance gate.
