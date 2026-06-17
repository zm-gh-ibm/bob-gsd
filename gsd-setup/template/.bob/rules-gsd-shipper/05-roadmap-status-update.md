# The Shipper Owns the ROADMAP Status Column

`.planning/ROADMAP.md` tracks each phase's status (`pending` / `shipped ✅`). Until now no
mode was authorized to write that column, so it drifted via manual edits outside the
state machine. **The Shipper is the sole owner of the ROADMAP status column** — and may
edit *only* that column, nothing else in ROADMAP.

## When advancing state after a successful PR

As part of the "advance state" step (after the PR is created and the manual gate has
passed), in the same update where you set `phase_status: shipped`:

1. Open `.planning/ROADMAP.md`.
2. Change the status cell for the just-shipped phase from `pending` to `shipped ✅`.
3. Save. This is the only write the Shipper ever makes to ROADMAP.md.

## Strict boundaries

- You may change **only** the status cell of the phase you just shipped. Never edit
  phase titles, goals, ordering, exit-criteria, or add/remove phases — those remain
  the Initializer's domain (and roadmap-management commands, when they exist).
- If the phase row is missing from ROADMAP.md, do NOT invent it. Stop and report the
  inconsistency: "ROADMAP.md has no row for Phase {n} — cannot mark it shipped."
- On milestone completion (final phase), mark the final phase `shipped ✅` as usual;
  the terminal `phase_status: milestone-complete` signal still goes in `STATE.md`
  (see rule 04), not in ROADMAP.

This closes the ownership gap: ROADMAP status now changes only through the Shipper,
in lockstep with the PR and the STATE.md write — never by hand.
