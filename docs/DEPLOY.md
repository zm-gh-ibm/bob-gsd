# GSD Deploy Guide

How to install the GSD workflow into any Mac project in under 2 minutes.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **macOS** | The deploy script is macOS-only. Linux/Windows: follow the manual steps below. |
| **Bob CLI** | Install from [bob.ai](https://bob.ai). Must be on `PATH`. |
| **python3** | Ships with macOS 10.15+. No additional packages needed. |
| **git** | The target project should be a git repo (for commit tracking). |

---

## Quick install (macOS)

```bash
# Clone this repo somewhere permanent (it's the source of truth)
git clone https://github.com/zack-maz/bob-gsd ~/tools/bob-gsd
cd ~/tools/bob-gsd

# Install GSD into your project
gsd-setup/scripts/deploy-gsd.sh ~/path/to/your-project
```

The script will:
1. Check prerequisites (`bob`, `python3`)
2. Ask you whether to install modes **project-scoped** or **globally**
3. Copy `.gsd/` scaffold, `.bob/rules-*/`, and `custom_modes.yaml` into the target
4. Append the `.bob/notes/` gitignore entry (idempotent)
5. Print next steps

### Dry-run first

```bash
scripts/deploy-gsd.sh ~/path/to/your-project --dry-run
```

Shows exactly what would be written without touching any files.

---

## What gets installed

```
<target>/
  .gsd/
    PROJECT.md          ← fill in during gsd-init interview
    REQUIREMENTS.md     ← fill in during gsd-init interview
    ROADMAP.md          ← fill in during gsd-init interview
    STATE.md            ← live program counter (seeded by gsd-init)
    STATE.schema.md     ← normative schema reference (do not edit)
    CONTEXT.md          ← per-phase plan (written by gsd-planner)
    VERIFY.md           ← verification reports (written by gsd-verifier)
    modes/
      yaml/             ← mode YAML definitions (reference; generated)
      docs/             ← human-readable mode docs (reference; generated)

  .bob/
    custom_modes.yaml   ← custom modes Bob loads (the live runtime copy)
    rules-agent/        ← general agent rules
    rules-ask/          ← ask-mode rules
    rules-gsd-executor/ ← executor behavioral guardrails
    rules-gsd-init/     ← initializer guardrails
    rules-gsd-orchestrator/ ← orchestrator guardrails
    rules-gsd-planner/  ← planner guardrails
    rules-gsd-shipper/  ← shipper guardrails
    rules-gsd-verifier/ ← verifier guardrails
    rules-plan/         ← plan-mode rules

  .gitignore            ← .bob/notes/ entry appended (idempotent)
```

---

## Mode scope: project vs global

| Scope | Where modes are written | Effect |
|---|---|---|
| **Project** | `<target>/.bob/custom_modes.yaml` | GSD modes available only in that project |
| **Global** | `~/.bob/custom_modes.yaml` | GSD modes available in every Bob project |

Choose **project** if you want to pilot GSD on one project first.
Choose **global** if you deploy GSD to multiple projects and want consistent mode availability.

> **Note:** The `.bob/rules-*/` files are always project-scoped (they go in the target's `.bob/`
> directory). Mode scope only affects where `custom_modes.yaml` is written.

---

## After install: first-time setup

```bash
cd <target-project>
# Open a Bob session in that directory, then:
# 1. Switch to "GSD Initializer" mode
# 2. Bob will interview you (≈10 questions) and write .gsd/{PROJECT,REQUIREMENTS,ROADMAP,STATE}.md
# 3. Switch to "GSD Orchestrator" mode
# 4. Send: "Advance the GSD workflow one step."
```

---

## Unattended loop (after init + planning approval)

Once the project is initialized and the first phase plan is approved, you can run
the full workflow autonomously:

```bash
cd <target-project>
<path-to-gsd-repo>/scripts/run-unattended.sh
```

This drives Bob in a loop (`max 50 iterations`) until:
- `phase_status: milestone-complete` → exits 0
- A blocker is detected in `STATE.md` → exits 1
- `bob` exits non-zero → exits 1

---

## Updating modes in an existing project

Edit `.bob/gsd_modes.yaml` directly — it is both the source of truth and the deployed
runtime copy that Bob loads. Then redeploy:

```bash
# Push the updated modes to target projects
scripts/deploy-gsd.sh ~/path/to/your-project
```

---

## Manual install (Linux / Windows)

If you can't use the deploy script, copy these by hand:

1. Copy `.gsd/` into your project root
2. Copy `.bob/rules-*/` into your project's `.bob/`
3. Copy `.bob/gsd_modes.yaml` to:
   - Project: `<target>/.bob/custom_modes.yaml`
   - Global: `~/.bob/custom_modes.yaml` (or Bob's equivalent global config)
4. Add `.bob/notes/` to your `.gitignore`

---

## Architecture: source of truth

```
.bob/gsd_modes.yaml     ← THE source of truth AND the deployed runtime copy (edit this)
        │
        └─ scripts/deploy-gsd.sh ──► <target>/.bob/custom_modes.yaml
```

**Edit `.bob/gsd_modes.yaml` directly.** No generation step is needed.
