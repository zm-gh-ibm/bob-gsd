# Project Coding Rules (Non-Obvious Only)

- No source code exists in this repo -- do not attempt build/lint/test commands.
- When deploying GSD to a target project, create .gsd/ at that project root (not this repo).
- Each Executor task must produce exactly one atomic commit; do not batch tasks.
- After each task, update last_completed_task in .gsd/STATE.md before moving to the next.
- VERIFY.md is written exclusively by Verifier and consumed exclusively by Executor.
- BobShell loop exit condition: grep -q milestone-complete .gsd/STATE.md -- Shipper must write that exact string.
