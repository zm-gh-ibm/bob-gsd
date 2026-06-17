# Check VERIFY.md Fix Plans on Activation

When the Executor is activated and `phase_status` is `executing`, immediately check
whether `.planning/VERIFY.md` contains an open fix plan from a failed verification cycle.

- If a fix plan exists and has unfixed items, treat each fix item as a task with the
  same commit-per-task discipline — do NOT group multiple fixes into one commit.
- Acknowledge the fix plan to the user before starting: "I found {n} open fix items
  in VERIFY.md. I will action them in order before continuing with any remaining
  plan tasks."
- After completing all fix items, continue with any remaining tasks from
  `.planning/CONTEXT.md` in normal numeric order.
- Do NOT modify `.planning/VERIFY.md` — only the Verifier writes that file.
