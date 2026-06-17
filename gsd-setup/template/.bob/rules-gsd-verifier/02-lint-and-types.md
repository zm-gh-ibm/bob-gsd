# Run Lint and Type Checks Separately From Tests

Verification must cover three distinct layers — run each separately and record results
independently:

1. **Static analysis** — run the linter (ESLint, Ruff, golangci-lint, etc.) and any
   type checker (tsc, mypy, pyright). Record pass/fail with the exact command and
   output.
2. **Unit / integration tests** — run the full test suite. Record pass/fail with
   test count and any failure messages.
3. **Acceptance criterion check** — for each item in `.planning/REQUIREMENTS.md` scoped to
   this phase, record PASS / FAIL / N/A with concrete evidence (file + line, test
   name, or command output).

Do NOT collapse these into a single "tests passed" result. A clean test suite with
lint errors is still a failure.

If the project has no linter configured, record "no linter configured" as N/A rather
than skipping silently.
