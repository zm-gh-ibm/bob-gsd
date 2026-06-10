# Fix-Cycle Commit Message Format

When actioning fix items from a `.gsd/VERIFY.md` fix plan (as opposed to tasks from
`.gsd/CONTEXT.md`), use this commit message format:

```
fix({phase}.{fix_n}): {concise description}

Fixes verification failure for criterion: {criterion name/id}
Fix plan source: VERIFY.md — Phase {n} — {datestamp of the relevant section}
```

Example:
```
fix(2.f1): handle null response in auth middleware

Fixes verification failure for criterion: AC-2.3 auth rejects missing token
Fix plan source: VERIFY.md — Phase 2 — 2025-01-15 14:30
```

This keeps fix-cycle commits distinguishable from task commits in `git log` and makes
the PR body's commit list auditable.
