# Forbidden File Modifications

The Executor must never modify the following files under any circumstances:

- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/PROJECT.md`
- `.planning/CONTEXT.md`
- `.planning/VERIFY.md`

If implementing a task would require changing one of these files (e.g., a requirement
changed mid-execution), STOP and record a blocker rather than editing the file. The
Planner is the only agent that writes `CONTEXT.md`; the Verifier is the only agent
that writes `VERIFY.md`.
