# Route Decision Transparency

After reading STATE.md and before delegating to a sub-mode, always tell the user in
one line what routing decision was made and why:

```
→ Routing to gsd-executor (phase_status: executing, last_completed_task: 2.1)
```

This single-line trace must appear **before** the delegation output, not after.
It allows the user to catch misroutes immediately without reading the full sub-mode
output.

Never skip this trace even when the routing seems obvious — the trace is for the user,
not for you.
