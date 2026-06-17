# Branch Naming Convention

When the Executor starts work on a new phase, the Shipper must create the PR from the
correct branch. Use the following convention when checking (or instructing the user to
set) the branch name:

- Format: `phase/{n}-{short-slug}` — e.g., `phase/2-auth-layer`
- The slug is derived from the phase title in `.planning/ROADMAP.md` (lowercase, hyphens,
  no spaces).
- If the branch does not follow this convention, note it in the PR body under
  "Branch note:" but do NOT block the ship.
- If the project has a branch strategy documented in `.planning/PROJECT.md`, that takes
  precedence over this default.
