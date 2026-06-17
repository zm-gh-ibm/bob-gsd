# bob-gsd

> **GSD** (Get Stuff Done) — an autonomous AI workflow for Bob that drives projects
> from requirements to shipped code, one phase at a time.

---

## Install — one-liner

```bash
curl -fsSL https://raw.githubusercontent.com/zm-gh-ibm/bob-gsd/main/gsd-setup/install.sh | bash
```

With a target path:
```bash
curl -fsSL https://raw.githubusercontent.com/zm-gh-ibm/bob-gsd/main/gsd-setup/install.sh \
  | bash -s -- ~/path/to/your-project
```

Dry-run (no files written):
```bash
curl -fsSL https://raw.githubusercontent.com/zm-gh-ibm/bob-gsd/main/gsd-setup/install.sh \
  | bash -s -- ~/path/to/your-project --dry-run
```

Install modes globally (available in every Bob project) instead of project-scoped:
```bash
curl -fsSL https://raw.githubusercontent.com/zm-gh-ibm/bob-gsd/main/gsd-setup/install.sh \
  | bash -s -- ~/path/to/your-project --global
```

Already cloned this repo?
```bash
gsd-setup/install.sh ~/path/to/your-project
```

---

## What gets installed

Running the installer copies into your target project:

- **`.gsd/`** — workflow state files (`PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, etc.)
- **`.bob/rules-*/`** — GSD mode behavioral guardrails
- **`.bob/gsd_modes.yaml`** — GSD mode definitions Bob loads at runtime
- **`.gitignore`** — `.gsd/`, `.bob/`, and `.bob/notes/` entries appended (idempotent)

See [`gsd-setup/docs/DEPLOY.md`](gsd-setup/docs/DEPLOY.md) for full details.

---

## After install

1. `cd` into your target project
2. Open a Bob session
3. Switch to **GSD Initializer** mode — Bob will interview you and write all `.gsd/` files
4. Switch to **GSD Orchestrator** and send: `"Advance the GSD workflow one step."`

---

## Platforms

| Platform | Method |
|---|---|
| macOS | `curl \| bash` or direct |
| Linux | `curl \| bash` or direct |
| Windows (Git Bash / WSL) | `curl \| bash` or direct |
| Windows (native) | Use `gsd-setup/scripts/run-unattended.bat` or `.ps1` for the loop; manual install for setup |

---

## Repository layout

```
bob-gsd/
  gsd-setup/              ← everything a user needs to install GSD
    install.sh            ← one-liner bootstrapper (curl entrypoint)
    scripts/              ← deploy + loop driver scripts (all platforms)
      deploy-gsd.sh       ← interactive installer
      run-unattended.sh   ← autonomous loop driver (bash / macOS / Linux / Git Bash)
      run-unattended.ps1  ← autonomous loop driver (PowerShell)
      run-unattended.bat  ← autonomous loop driver (cmd.exe)
      gen-modes.sh        ← mode validator
    docs/
      DEPLOY.md           ← full deploy reference
    template/
      .bob/               ← GSD mode definitions + rules (source of truth; copied on install)
        gsd_modes.yaml    ← THE source of truth for GSD modes (edit this)
        rules-*/          ← per-mode behavioral guardrails
      .gsd/               ← scaffold templates (copied into target projects on install)
```

---

## File reference

| File | Purpose |
|---|---|
| [`gsd-setup/install.sh`](gsd-setup/install.sh) | One-liner bootstrapper — curl entrypoint |
| [`gsd-setup/scripts/deploy-gsd.sh`](gsd-setup/scripts/deploy-gsd.sh) | Interactive installer (all platforms) |
| [`gsd-setup/scripts/run-unattended.sh`](gsd-setup/scripts/run-unattended.sh) | Autonomous loop driver (bash) |
| [`gsd-setup/scripts/run-unattended.ps1`](gsd-setup/scripts/run-unattended.ps1) | Autonomous loop driver (PowerShell) |
| [`gsd-setup/scripts/run-unattended.bat`](gsd-setup/scripts/run-unattended.bat) | Autonomous loop driver (cmd.exe) |
| [`gsd-setup/scripts/gen-modes.sh`](gsd-setup/scripts/gen-modes.sh) | Mode validator |
| [`gsd-setup/docs/DEPLOY.md`](gsd-setup/docs/DEPLOY.md) | Full deploy reference |
