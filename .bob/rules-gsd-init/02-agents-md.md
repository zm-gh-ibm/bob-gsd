# Seed AGENTS.md When Missing

After writing all four `.gsd/` files, check whether `AGENTS.md` exists at the project
root.

- If it does **not** exist, create a minimal `AGENTS.md` that documents: repo nature,
  GSD state file conventions (STATE.md, PROJECT.md, REQUIREMENTS.md, ROADMAP.md,
  CONTEXT.md, VERIFY.md), critical behavioral rules, and the mode slug table.

- If it **already** exists, do not overwrite it. Append a brief GSD section at the
  bottom only if the file does not already mention GSD.

This ensures every project initialized with GSD has an `AGENTS.md` that future agents
can read to understand the workflow without being told verbally.
