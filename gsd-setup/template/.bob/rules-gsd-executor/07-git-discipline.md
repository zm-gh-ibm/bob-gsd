# Git Discipline — Precise Staging, No Destructive Commands

One atomic commit per task (rule already established) depends on **precise staging** and
a prohibition on destructive git that can silently discard work.

## Staging

- **Never** `git add .`, `git add -A`, or `git add --all`. Stage the specific files
  your task changed, by path: `git add path/to/file1 path/to/file2`.
- Before committing, run `git status` and confirm only the intended task files are
  staged. If unrelated changes are present, do not sweep them into the commit — stop
  and report the unexpected changes.

## Forbidden (destructive) commands

The Executor must NEVER run any of the following — each can destroy uncommitted or
committed work without a recovery path:

- `git reset --hard` (any ref)
- `git clean` (any flags) — deletes untracked files
- blanket `git checkout -- .` / `git checkout .` / `git restore .`
- `git stash` (any form) — a shared stash list contaminates state and silently hides work
- `git push --force` / `git push -f` to any branch you do not exclusively own
- `git rebase`, `git commit --amend`, or history rewriting of already-committed tasks

## If you need to undo something

- To discard a change to ONE specific file you just made (and have not committed),
  use a targeted `git checkout -- <single-path>` — never the whole tree.
- To recover from a bad commit, do NOT `reset --hard`. Stop, record a blocker
  describing the situation, and let the user decide. Losing committed task history
  breaks the PR audit trail the Shipper depends on.

The commit-per-task trail is the project's memory of what was built and why. Treat it
as append-only.

## STATE.md format

When you update `.planning/STATE.md` (e.g. writing `last_completed_task` after a task), keep
the file in the canonical format defined in
[`.planning/STATE.schema.md`](../../.planning/STATE.schema.md): plain `key: value` lines, no
markdown bold, header exactly `# STATE`. Never reformat existing keys into bold or change
the header — the loop scripts parse these lines literally.
