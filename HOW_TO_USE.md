# GSD — How to Use: Agent Orchestration & Workflow Control

This guide explains how the GSD workflow is structured, how agents hand off to each
other, and exactly where you can choose to stay in control versus let the loop run
autonomously.

---

## The Big Picture

GSD is a **state-machine workflow** for AI-assisted software development. A single file
on disk — [`.gsd/STATE.md`](.gsd/STATE.md) — is the program counter. Every agent reads
from it and writes back to it. No agent ever trusts its own memory over what the file
says.

The workflow has one primary entry point: the **GSD Orchestrator**. It reads state,
consults a routing table, and delegates to a specialist agent. Those agents do their
work, persist their exit status, and hand control back. This creates a reproducible,
resumable loop that survives session crashes, context resets, and multi-day gaps.

```
STATE.md (program counter)
      │
      ▼
GSD Orchestrator ──┬──► GSD Planner    (phase_status: discussing)
                   ├──► GSD Executor   (phase_status: executing)
                   ├──► GSD Verifier   (phase_status: verifying)
                   └──► GSD Shipper    (phase_status: verifying, clean)
```

---

## The Six Agents

### 1. GSD Initializer (`gsd-init`)

**One-time project bootstrapper.** Runs an interview (≈10 questions) and writes:

- [`.gsd/PROJECT.md`](.gsd/PROJECT.md) — name, purpose, users, stack, constraints, risks
- [`.gsd/REQUIREMENTS.md`](.gsd/REQUIREMENTS.md) — feature list with acceptance criteria
- [`.gsd/ROADMAP.md`](.gsd/ROADMAP.md) — milestone broken into phases
- [`.gsd/STATE.md`](.gsd/STATE.md) — seeded to `phase_status: discussing`

**Run once, never again.** If these files exist and are populated, do not re-invoke —
it will overwrite them.

---

### 2. GSD Orchestrator (`gsd-orchestrator`)

**The program counter.** Your primary entry point for every work session after init.

The Orchestrator:
- Re-reads [`STATE.md`](.gsd/STATE.md) on every single turn (never trusts memory)
- Checks for blockers — halts if any are open
- Emits a one-line routing trace before delegating (e.g. `→ Routing to gsd-executor (phase_status: executing, last_completed_task: 2.1)`)
- Delegates to the correct specialist
- Writes updated `STATE.md` after each transition it owns

**The Orchestrator never writes source code, runs tests, or creates PRs.** It is
purely a coordinator.

**Human-in-the-loop gates the Orchestrator enforces:**

| Gate | When | What it does |
|---|---|---|
| Plan approval | `phase_status: planned` | Presents the plan, stops, waits for `"approved"` |
| Blocker surface | `blockers:` is non-empty | Surfaces it, halts — you decide what to do |

---

### 3. GSD Planner (`gsd-planner`)

**Spec-driven planning agent.** Reads [`REQUIREMENTS.md`](.gsd/REQUIREMENTS.md) and
[`ROADMAP.md`](.gsd/ROADMAP.md), researches the codebase, and produces a detailed
atomic task list.

The Planner:
- Resolves or escalates `open_decisions` from `STATE.md` before planning
- Archives the previous phase's [`CONTEXT.md`](.gsd/CONTEXT.md) before overwriting it
  (saved to `.gsd/phases/{n}/CONTEXT.md`)
- Numbers every task as `{phase}.{n}` (e.g. `2.1`, `2.2`) — the Executor and
  Orchestrator depend on these IDs
- Classifies new dependencies as `[OK]`, `[SUS]`, or `[SLOP]` — `[SLOP]` packages
  are rejected before execution
- Proves decision coverage: every `D-x.y` decision must map to at least one task
- Sets `phase_status: planned` in `STATE.md` **before** stopping at the approval gate
- **Stops and waits for explicit user approval** — does not hand off to the Executor

**Task atomicity rule:** a task should touch ≤ 3 files and take ≤ ~30 minutes. If it
needs more than 2–3 sentences to describe, it should be split.

---

### 4. GSD Executor (`gsd-executor`)

**Autonomous implementation agent.** Executes the approved plan from
[`CONTEXT.md`](.gsd/CONTEXT.md) task by task.

The Executor:
- Reads `last_completed_task` from `STATE.md` to know where to resume
- Makes **one atomic git commit per task** — format:
  `task({id}): {description} — Implements task {id} from phase {phase} plan`
- Updates `STATE.md` after *each* commit (not in a batch at the end)
- Never expands scope; never makes improvements outside the plan
- If it cannot complete a task, records a blocker in `STATE.md` and stops
- When all tasks are done, sets `phase_status: verifying`

**The Executor is the only agent that writes source code.**

---

### 5. GSD Verifier (`gsd-verifier`)

**Quality gate agent.** Tests the phase's output against acceptance criteria.

The Verifier:
- Runs the actual test suite (does not rely on code inspection alone)
- Tests every acceptance criterion from [`REQUIREMENTS.md`](.gsd/REQUIREMENTS.md)
- Writes a structured [`VERIFY.md`](.gsd/VERIFY.md) report: PASS/FAIL per criterion
  with concrete evidence
- For failures: writes a precise fix plan (exact files, functions, changes) — not vague
  guidance
- Appends to `VERIFY.md` rather than overwriting (full history is preserved)
- Sets `phase_status: executing` if there are open failures (routes back to Executor)
- Leaves `phase_status: verifying` on a clean pass (Orchestrator routes to Shipper)

**The Verifier diagnoses — it never fixes.** Fixes go back to the Executor.

---

### 6. GSD Shipper (`gsd-shipper`)

**Release agent.** Confirms clean verification, creates the PR, and advances state.

The Shipper:
- Refuses to create a PR if any failures remain in [`VERIFY.md`](.gsd/VERIFY.md)
- **Presents the PR draft and stops for manual approval before creating it**
- PR title format: `phase({n}): {phase title} [milestone v{m}]`
- PR body contains: phase objective, task list with commit SHAs, verification summary
- After PR creation: sets `phase_status: shipped`, advances `current_phase`, sets new
  phase to `discussing`
- On the final phase: writes `phase_status: milestone-complete` — the loop exits

---

## The State Machine

`STATE.md` is the single source of truth. Its `phase_status` field drives all routing:

```
discussing ──► planned ──► executing ──► verifying ──► shipped ──► (next phase: discussing)
                  │                          │
                  │  (user approves plan)    │  (failures found)
                  └──────────────────────────┘
                         re-route to executor
                                            │
                                            │  (all pass)
                                            ▼
                                         shipper ──► milestone-complete
```

| `phase_status` | Who set it | Who acts next |
|---|---|---|
| `discussing` | Orchestrator (on phase advance) | Planner |
| `planned` | Planner (self-persists before stopping) | Orchestrator (approval gate) |
| `executing` | Orchestrator (after plan approval) | Executor |
| `verifying` | Executor (when all tasks done) | Verifier |
| `shipped` | Shipper (after PR created) | Orchestrator (advances phase) |
| `milestone-complete` | Shipper (final phase shipped) | Loop exits |

**Critical:** each agent persists its own exit status. The Orchestrator cannot write
after a `switch_mode` hand-off because the turn ends inside the sub-mode. This is why:
- The Planner sets `planned` before the approval gate stop
- The Executor sets `verifying` when done
- The Verifier sets `executing` on failures (or leaves `verifying` on a clean pass)
- The Shipper sets `shipped` / `milestone-complete`

---

## Human-in-the-Loop Gates

GSD has **three mandatory human approval gates**. They are hardcoded — no configuration
removes them.

### Gate 1 — Plan Approval

**When:** `phase_status` transitions from `discussing` → `planned`

**What happens:** The Orchestrator presents the full task list (with `{phase}.{n}` IDs)
from [`CONTEXT.md`](.gsd/CONTEXT.md). You review, request changes if needed, then
explicitly say `"approved"`, `"go"`, or equivalent. Saying `"looks good"` or `"sounds
right"` is **not** treated as approval — the Orchestrator requires an unambiguous token.

**What you can do here:**
- Request that tasks be split further
- Ask the Planner to document a different approach
- Reject the plan entirely and ask for a re-plan
- Mark scope out-of-bounds for this phase

**What you should not do:** approve a plan with `[SLOP]` packages or uncovered
decisions — these are bugs that will surface during execution or verification.

---

### Gate 2 — PR Approval

**When:** Verifier reports a clean pass → Shipper prepares to create the PR

**What happens:** The Shipper presents the full PR draft (title + body with commit SHAs)
and waits for an explicit `"go"`, `"ship it"`, or `"approved"` before creating the PR.

**What you can do here:**
- Review every commit SHA in the PR body
- Edit the PR title or body before approving
- Hold the ship if you spot something the Verifier missed

---

### Gate 3 — Blocker Surface

**When:** The Executor records a blocker in `STATE.md`

**What happens:** The Orchestrator surfaces the blocker and halts. The loop does not
advance until you resolve it — GSD will not silently skip tasks or work around a blocker.

**Common resolutions:**
- Provide a missing API key or credential
- Resolve an external dependency
- Clarify an ambiguous requirement
- Modify the plan in `CONTEXT.md` and set `phase_status: discussing` to re-plan

---

## Manual vs. Automated: Choosing Your Level of Control

GSD supports a spectrum from fully supervised to fully autonomous. The right choice
depends on phase complexity, team trust, and deadline pressure.

### Option A — Fully Supervised (maximum control)

Run the Orchestrator yourself each step, read each output, and provide the approval
tokens manually. Best for:
- Complex architectural phases
- First-time use of GSD on a project
- Any phase that modifies database schemas, infra config, or auth

**Workflow:**
1. Switch to `gsd-orchestrator`
2. Send: `"Advance the GSD workflow one step."`
3. Read the output
4. Send approval or instructions
5. Repeat

---

### Option B — Supervised Execution (mixed)

Let execution run autonomously but supervise the approval gates yourself. This is the
recommended default for most teams.

**Practical pattern:**
1. Use the Orchestrator manually for the `discussing → planned` transition (so you
   approve the plan yourself)
2. Once you send `"approved"`, the Executor runs to completion unattended
3. Review the Verifier's [`VERIFY.md`](.gsd/VERIFY.md) report
4. Review the Shipper's PR draft before sending `"go"`

This keeps a human in the loop at the two highest-value decision points (what gets
built, and what gets shipped) while automating the mechanical implementation loop.

---

### Option C — Fully Autonomous (maximum speed)

Use the unattended loop scripts to drive the Orchestrator automatically until a milestone
is complete, a blocker is hit, or the safety cap is reached.

```bash
# bash / macOS / Linux / Git Bash
gsd-setup/scripts/run-unattended.sh

# PowerShell (Windows)
gsd-setup/scripts/run-unattended.ps1

# cmd.exe (Windows)
gsd-setup/scripts/run-unattended.bat
```

The script calls:
```
bob --chat-mode gsd-orchestrator --approval-mode yolo \
    "Advance the GSD workflow one step."
```
in a loop. It exits when:

| Condition | Exit code |
|---|---|
| `phase_status: milestone-complete` in `STATE.md` | `0` |
| `blockers:` non-empty in `STATE.md` | `1` |
| `bob` exits non-zero | `1` |
| Safety cap reached (50 iterations) | `1` |

**Note:** In `--approval-mode yolo`, the plan approval and PR approval gates still
exist in the agent logic — but if you are scripting responses, you must ensure your
automation provides the explicit approval tokens the Orchestrator and Shipper require.
The gates are behavioral, not OS-level permission checks.

**When to use:** CI/CD pipelines, overnight runs, repetitive feature phases where
you have already reviewed the plan once and trust the Executor to implement it cleanly.

---

### Option D — Direct Sub-mode Invocation (surgical recovery)

Activate a specialist directly when you need to re-do a specific step without running
the full loop.

| Situation | What to do |
|---|---|
| Re-plan after scope change | Set `phase_status: discussing` in `STATE.md`, switch to `gsd-planner` |
| Resume execution after a blocker is cleared | Confirm `phase_status: executing` in `STATE.md`, switch to `gsd-executor` |
| Re-verify after a manual hotfix | Confirm `phase_status: verifying` in `STATE.md`, switch to `gsd-verifier` |
| Recover a crashed ship | Confirm `VERIFY.md` is clean, switch to `gsd-shipper` |

**Rules for direct invocation:**
- Always re-read `STATE.md` first — never assume the phase or status
- The Planner refuses to run if `phase_status` is not `discussing`
- The Executor reads `last_completed_task` to resume mid-phase — do not reset it unless
  you intend to re-run already-committed tasks
- The Shipper re-reads `VERIFY.md` on every invocation — there is no way to bypass the
  clean-check gate

---

## Retry Loop Protection

If the Orchestrator delegates to the same agent 3 consecutive times with no progress
(`last_completed_task` never advances), it stops automatically and records a
`stuck-loop` blocker in `STATE.md`. This prevents infinite loops during autonomous runs.

When this happens, you will see:
> "The workflow appears to be stuck — phase {n} has been in `{status}` for 3 consecutive
> delegations with no task progress."

**Resolution:** read [`STATE.md`](.gsd/STATE.md), read [`CONTEXT.md`](.gsd/CONTEXT.md),
identify what is blocking the Executor, resolve it, clear the blocker, and re-invoke.

---

## Common Workflow Patterns

### Starting fresh on a new project

```
1. Install GSD:    gsd-setup/install.sh ~/path/to/project
2. cd ~/path/to/project
3. Open Bob → switch to gsd-init
4. Answer the 10-question interview
5. Confirm the summary → files are written
6. Switch to gsd-orchestrator
7. Send: "Advance the GSD workflow one step."
```

---

### Resuming after a session gap

```
1. Open Bob → switch to gsd-orchestrator
2. Send: "Advance the GSD workflow one step."
   → Orchestrator re-reads STATE.md from disk
   → Routes to wherever the workflow left off
   → No manual state recovery needed
```

---

### Changing scope mid-phase

```
1. Switch to gsd-planner (or gsd-orchestrator)
2. Tell the Orchestrator about the scope change
3. If phase_status is executing:
   - Set phase_status: discussing in STATE.md manually
   - Switch to gsd-planner
4. Planner re-plans, presents revised task list
5. Approve the new plan → execution continues
```

---

### Adding a new phase to the roadmap

```
1. Edit .gsd/ROADMAP.md — add the new phase row and Phase Details section
2. After the current phase ships, the Orchestrator will see the new phase
   in the roadmap and automatically set it to discussing
```

---

### Recovering from a stuck loop

```
1. Read .gsd/STATE.md — note the blocker
2. Read .gsd/CONTEXT.md — find the failing task
3. Fix whatever is blocking (dependency, env var, config)
4. Edit STATE.md — set blockers: none
5. Switch to gsd-orchestrator
6. Send: "Advance the GSD workflow one step."
```

---

## File Reference

| File | Owner | Purpose |
|---|---|---|
| [`.gsd/STATE.md`](.gsd/STATE.md) | Orchestrator / all agents | Program counter — the single source of truth |
| [`.gsd/PROJECT.md`](.gsd/PROJECT.md) | Initializer | Project name, goals, stack, constraints |
| [`.gsd/REQUIREMENTS.md`](.gsd/REQUIREMENTS.md) | Initializer | Feature list with acceptance criteria |
| [`.gsd/ROADMAP.md`](.gsd/ROADMAP.md) | Initializer / Shipper | Milestone → phase map; Shipper updates status column |
| [`.gsd/CONTEXT.md`](.gsd/CONTEXT.md) | Planner | Current phase task list + implementation decisions |
| [`.gsd/VERIFY.md`](.gsd/VERIFY.md) | Verifier | Pass/fail report per acceptance criterion |
| [`.gsd/phases/{n}/CONTEXT.md`](.gsd/) | Planner (archive) | Archived plan from phase n — never overwritten |
| [`.gsd/STATE.schema.md`](.gsd/STATE.schema.md) | Reference | Canonical format spec for STATE.md |

---

## What Each Agent Can and Cannot Do

| Agent | Writes source code | Runs tests | Creates PRs | Modifies REQUIREMENTS / ROADMAP |
|---|---|---|---|---|
| Initializer | ✗ | ✗ | ✗ | ✓ (creates them) |
| Orchestrator | ✗ | ✗ | ✗ | ✗ |
| Planner | ✗ | ✗ | ✗ | ✗ |
| Executor | ✓ | ✓ (post-commit) | ✗ | ✗ |
| Verifier | ✗ | ✓ | ✗ | ✗ |
| Shipper | ✗ | ✗ | ✓ | ✗ (updates ROADMAP status column only) |

---

## Quick Reference: Commands

| What you want | What to say |
|---|---|
| Advance the workflow | `"Advance the GSD workflow one step."` (in gsd-orchestrator) |
| Approve a plan | `"Approved."` / `"Go."` / `"Proceed."` |
| Approve a PR | `"Go."` / `"Ship it."` / `"Approved."` |
| Re-plan current phase | Set `phase_status: discussing` → `"Advance the GSD workflow one step."` |
| Check current state | Read `.gsd/STATE.md` |
| Run autonomously | `gsd-setup/scripts/run-unattended.sh` |
