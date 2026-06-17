# Project Architecture Rules (Non-Obvious Only)

- State machine has 5 ordered working phase_status values: discussing, planned, executing, verifying, shipped (no skipping), plus ONE terminal value: milestone-complete. The Shipper writes milestone-complete only on the final phase; it is the sole accepted loop-exit signal (the BobShell scripts and rules-agent/AGENTS.md grep for it verbatim).
- planned->executing is the ONLY transition requiring explicit human approval. All others are automatic.
- Orchestrator is stateless across turns by design -- re-reads STATE.md every turn to defeat context rot.
- Parallelism is intentionally absent. The Bob-native loop is sequential. Do not plan parallel sub-agents.
- Optional GSD-2 MCP backend must be verified with a clean boot (no provider key) before relying on it.
- CONTEXT.md is the Planner output and Executor sole scope input. Anything not written there is out-of-scope.
