# Commit Pending Workflow State Before the Clean-Tree Check

The Shipper's pre-ship checklist (rule 01) aborts if `git status` shows any uncommitted
changes. But the loop itself produces uncommitted changes: the Orchestrator and sub-modes
write `.planning/STATE.md`, `.planning/VERIFY.md`, etc. as the phase progresses, and no mode commits
them. In the Phase 7 live run this left the tree dirty and the clean-tree gate blocked until
an operator hand-committed (defect F-5). The Shipper must close that gap itself.

The same gap applies to `AGENTS.md`: `gsd-init` creates it (per
`rules-gsd-init/02-agents-md`) but no mode commits it, so it stays untracked through the
whole milestone (defect F-7, the post-Phase-8 live drive). It is a known, expected GSD
artifact — the Shipper commits it alongside the `.planning/` state.

## Step (runs FIRST in the Shipper turn, before rule 01's clean-tree check)

1. Run `git status --short` and inspect what is pending.
2. Stage **only** the known GSD workflow artifacts that changed — by explicit path, never
   `git add -A`/`git add .` (git-discipline still applies):
   - `.planning/STATE.md`
   - `.planning/CONTEXT.md`
   - `.planning/VERIFY.md`
   - `.planning/ROADMAP.md`
   - `.planning/phases/` (anything under it)
   - `AGENTS.md` — **only if** it appears in `git status` as untracked or modified. Once it
     has been committed in an earlier phase it will not appear here, so this is idempotent;
     do not re-stage an unchanged file.
3. If any of those are staged, commit them as:
   ```
   chore(phase {n}): workflow state
   ```
4. Then proceed to rule 01. With the `.planning/` state and `AGENTS.md` committed, the only
   remaining tree contents are the phase's actual task commits — the clean-tree check now
   passes.

## Boundaries

- Stage the known GSD artifacts **only**: the `.planning/` paths above and `AGENTS.md`. If
  `git status` shows any OTHER file you did not expect (source files, build artifacts), do
  NOT sweep it in — stop and report it; an unexpected dirty tree may mean a task was left
  incomplete.
- One `chore(phase {n}): workflow state` commit per ship. Do not amend prior task commits.
- `.bob/notes/` is git-ignored (see repo `.gitignore`) because `bob` rewrites that file on
  every commit, which would otherwise re-dirty the tree immediately after this commit.
