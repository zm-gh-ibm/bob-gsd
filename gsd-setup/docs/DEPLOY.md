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
curl -fsSL https://raw.githubusercontent.com/zm-gh-ibm/bob-gsd/main/gsd-setup/install.sh | bash
```

**With a target path:**
```bash
curl -fsSL https://raw.githubusercontent.com/zm-gh-ibm/bob-gsd/main/gsd-setup/install.sh \
  | bash -s -- ~/path/to/your-project
```

**Dry-run first** (no files written):
```bash
curl -fsSL https://raw.githubusercontent.com/zm-gh-ibm/bob-gsd/main/gsd-setup/install.sh \
  | bash -s -- ~/path/to/your-project --dry-run
```

---

## Quick install — already cloned

```bash
git clone https://github.com/zm-gh-ibm/bob-gsd ~/tools/bob-gsd
~/tools/bob-gsd/gsd-setup/install.sh ~/path/to/your-project
```

The bootstrapper (`install.sh`) handles clone-if-needed and then delegates to `deploy-gsd.sh`.

---

## What the installer does

1. Checks prerequisites (`bob`, `python3` — warns, doesn't abort)
2. Asks whether to install modes **project-scoped** or **globally**
3. Copies `.gsd/` scaffold, `.bob/rules-*/`, and `custom_modes.yaml` into the target
4. Appends `.gsd/`, `.bob/`, and `.bob/notes/` gitignore entries (idempotent)
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

  .bob/
    custom_modes.yaml      ← custom modes Bob loads (the live runtime copy)
    rules-agent/        ← general agent rules
    rules-ask/          ← ask-mode rules
    rules-gsd-executor/ ← executor behavioral guardrails
    rules-gsd-init/     ← initializer guardrails
    rules-gsd-orchestrator/ ← orchestrator guardrails
    rules-gsd-planner/  ← planner guardrails
    rules-gsd-shipper/  ← shipper guardrails
    rules-gsd-verifier/ ← verifier guardrails
    rules-plan/         ← plan-mode rules

  .gitignore            ← .bob/notes/ + .gsd/ + .bob/ entries appended (idempotent)
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

1. Copy `gsd-setup/template/.gsd/` into your project root as `.gsd/`
2. Copy `gsd-setup/template/.bob/rules-*/` into your project's `.bob/`
3. Copy `gsd-setup/template/.bob/custom_modes.yaml` to:
   - Project: `<target>/.bob/custom_modes.yaml`
   - Global: `~/.bob/custom_modes.yaml` (or Bob's equivalent global config)
4. Add `.bob/notes/`, `.gsd/`, and `.bob/` to your `.gitignore`

---

## Architecture: source of truth

```
gsd-setup/template/.bob/custom_modes.yaml     ← THE source of truth (edit this)
        │
        └─ gsd-setup/scripts/deploy-gsd.sh ──► <target>/.bob/custom_modes.yaml
```

**Edit `gsd-setup/template/.bob/custom_modes.yaml` directly.** No generation step is needed.
Run `gsd-setup/scripts/gen-modes.sh` to validate mode count and structure.

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
      gen-modes.sh        ← mode validator (thin wrapper)
      gen_modes.py        ← mode validator (python core)
    docs/
      DEPLOY.md           ← this file
    template/
      .bob/               ← mode definitions + rules (source of truth; copied on install)
        custom_modes.yaml    ← THE source of truth for all GSD modes
        rules-agent/
        rules-ask/
        rules-gsd-executor/
        rules-gsd-init/
        rules-gsd-orchestrator/
        rules-gsd-planner/
        rules-gsd-shipper/
        rules-gsd-verifier/
        rules-plan/
      .gsd/               ← scaffold templates (copied to target projects on install)
        PROJECT.md
        REQUIREMENTS.md
        ROADMAP.md
        STATE.md
        STATE.schema.md
        CONTEXT.md
        VERIFY.md
```
