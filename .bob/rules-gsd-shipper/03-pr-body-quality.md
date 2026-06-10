# PR Body Must Include Verification Cycle Count

Include the number of verification cycles this phase required in the PR body. Extract
this from `.gsd/VERIFY.md` by counting dated section headers for the current phase.

Format in the PR body:
```
**Verification cycles:** {n}  (1 = passed first time)
```

This gives reviewers and the team visibility into implementation quality over time.
If the phase required more than 2 cycles, include a brief "lessons learned" sentence
summarising what caused the re-work.
