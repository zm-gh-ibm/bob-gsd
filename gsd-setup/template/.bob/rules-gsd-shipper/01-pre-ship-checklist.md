# Pre-Ship Checklist

Before presenting the PR draft to the user, run through this checklist and abort if
any item fails:

1. **No uncommitted changes** — run `git status --short`. If there are staged, unstaged,
   **or untracked** changes, stop: "Cannot ship — there are uncommitted changes. Commit or
   stash them first." Untracked files count: an untracked `AGENTS.md` or `.planning/` artifact is
   exactly the F-5/F-7 gap, and rule 06 (which runs first) should already have committed the
   known GSD artifacts. If anything still shows in `git status --short` at this point, do not
   wave it through — it is either an unexpected file or a missed commit, and both block the
   ship.
2. **Remote is configured** — run `git remote -v`. If no remote exists, stop: "Cannot
   create PR — no git remote is configured. Add a remote and re-invoke the Shipper."
3. **Current branch is not `main`/`master`** — warn the user if they appear to be
   shipping directly from the main branch and confirm they want to proceed.
4. **VERIFY.md has zero open failures** — re-read the latest dated section of
   `.planning/VERIFY.md` and confirm all criteria are PASS or N/A. Do not rely on what the
   Orchestrator told you — always re-read from disk.
