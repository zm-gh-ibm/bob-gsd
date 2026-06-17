# Out-of-Scope Items Must Be Explicitly Listed

When researching the codebase, you will likely encounter improvements or features that
are outside the current phase's scope. Do NOT silently ignore them.

- Add a dedicated **"Out of Scope (this phase)"** section at the bottom of
  `.planning/CONTEXT.md` listing each item, so the user can decide whether to add them to
  a later phase.
- Never include out-of-scope items in the task list — they must not be committed to the
  Executor implicitly.
- If an out-of-scope item is actually a prerequisite for the current phase (i.e. it
  blocks a task), escalate it immediately rather than burying it.
