# GSD Deploy Guide

How to install the GSD workflow into any project in under 2 minutes — on macOS, Linux,
or Windows (Git Bash / WSL).

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **macOS / Linux / Windows (Git Bash / WSL)** | All platforms supported. |
| **Bob CLI** | Install from [bob.ai](https://bob.ai). Must be on `PATH`. |
| **python3** | Required for mode-merge step only. Ships with macOS 10.15+ and most Linux distros. |
| **git** | Required if not already cloned. |

---

## Quick install — one-liner (curl)

```bash
curl -fsSL https://raw.githubusercontent.com/zack-maz/bob-gsd/main/gsd-setup/install.sh | bash
```

**With a target path:**
```bash
curl -fsSL https://raw.githubusercontent.com/zack-maz/bob-gsd/main/gsd-setup/install.sh \
  | bash -s -- ~/path/to/your-project
```

**Dry-run first** (no files written):
```bash
curl -fsSL https://raw.githubusercontent.com/zack-maz/bob-gsd/main/gsd-setup/install.sh \
  | bash -s -- ~/path/to/your-project --dry-run
```

---

## Quick install — already cloned

```bash
git clone https://github.com/zack-maz/bob-gsd ~/tools/bob-gsd
~/tools/bob-gsd/gsd-setup/install.sh ~/path/to/your-project
```

The bootstrapper (`install.sh`) handles clone-if-needed and then delegates to `deploy-gsd.sh`.

---

## What the installer does

1. Checks prerequisites (`bob`, `python3` — warns, doesn't abort)
2. Asks whether to install modes **project-scoped** or **globally**
3. Copies `.gsd/` scaffold, `.bob/rules-*/`, and `custom_modes.yaml` into the target
4. Appends the `.bob/notes/` gitignore entry (idempotent)
5. Prints next steps

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
# macOS / Linux / Git Bash
cd <target-project>
~/tools/bob-gsd/gsd-setup/scripts/run-unattended.sh

# Windows (PowerShell)
~\tools\bob-gsd\gsd-setup\scripts\run-unattended.ps1

# Windows (cmd.exe)
%USERPROFILE%\tools\bob-gsd\gsd-setup\scripts\run-unattended.bat
```

This drives Bob in a loop (`max 50 iterations`) until:
- `phase_status: milestone-complete` → exits 0
- A blocker is detected in `STATE.md` → exits 1
- `bob` exits non-zero → exits 1

---

## Updating an existing install

```bash
cd ~/tools/bob-gsd
git pull
gsd-setup/install.sh ~/path/to/your-project
```

The installer detects existing `custom_modes.yaml` and offers to overwrite, merge, or skip.
When merging, the existing file is automatically backed up to `.bak-<timestamp>`.

---

## Manual install (any platform)

If you can't use the installer, copy these by hand:

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
        └─ gsd-setup/scripts/deploy-gsd.sh ──► <target>/.bob/custom_modes.yaml
```

**Edit `.bob/gsd_modes.yaml` directly.** No generation step is needed.

---

## Repository layout

```
bob-gsd/
  gsd-setup/              ← everything a user needs to install GSD
    install.sh            ← one-liner bootstrapper (curl | bash entrypoint)
    scripts/
      deploy-gsd.sh       ← interactive installer (all platforms)
      run-unattended.sh   ← autonomous loop driver (bash)
      run-unattended.ps1  ← autonomous loop driver (PowerShell)
      run-unattended.bat  ← autonomous loop driver (cmd.exe)
      gen-modes.sh        ← mode validator
      gen_modes.py        ← mode validator (python core)
    docs/
      DEPLOY.md           ← this file
    test/
      simulate-gates.js   ← state-machine gate simulation
      validate-loop.js    ← loop script validation suite
    .gitignore.snippet    ← snippet appended to target .gitignore

  .gsd/                   ← scaffold templates (copied to target projects)
  .bob/                   ← mode definitions + rules (copied to target projects)
```
