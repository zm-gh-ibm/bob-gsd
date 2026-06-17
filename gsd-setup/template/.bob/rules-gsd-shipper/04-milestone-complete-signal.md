# Milestone Complete Signal

When the Shipper advances to the final phase and there are no further phases in
`.planning/ROADMAP.md`, it must write the following exact string to `.planning/STATE.md` as the
final `phase_status` value:

```
phase_status: milestone-complete
```

The BobShell auto-loop exit condition is:
```bash
grep -q "milestone-complete" .planning/STATE.md
```

If the Shipper writes any other value (e.g. `shipped`, `complete`, `done`), the
BobShell loop will not exit. `milestone-complete` is the only accepted terminal state.

Also report to the user: "Milestone {m} complete. All phases shipped."

## STATE.md format

Every `STATE.md` write — including this terminal `phase_status: milestone-complete` line
and the `phase_status: shipped` write — must conform to the canonical schema in
[`.planning/STATE.schema.md`](../../.planning/STATE.schema.md): plain `key: value` lines, no
markdown bold, header exactly `# STATE`. A bold-decorated or alternately-headed line will
not match the loop scripts' parsers and the loop will never exit.
