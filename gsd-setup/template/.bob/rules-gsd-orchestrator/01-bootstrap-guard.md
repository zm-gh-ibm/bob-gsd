# Bootstrap Guard — STATE.md May Not Exist

At the very start of every turn, before running the routing table, check whether
`.gsd/STATE.md` exists on disk.

- If it does **not** exist, do not attempt to route. Instead, tell the user:
  "`.gsd/STATE.md` does not exist. This project has not been initialized yet. Switch
  to the `gsd-init` mode to bootstrap the project."
- Do NOT create `STATE.md` yourself — that is the Initializer's job.
- Do NOT attempt to infer state from the conversation — the file is the only
  source of truth.
