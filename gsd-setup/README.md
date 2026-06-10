# GSD Setup

This directory contains everything needed to install the GSD workflow into any project.

---

## One-liner install

```bash
curl -fsSL https://raw.githubusercontent.com/zack-maz/bob-gsd/main/gsd-setup/install.sh | bash
```

With a target path:
```bash
curl -fsSL https://raw.githubusercontent.com/zack-maz/bob-gsd/main/gsd-setup/install.sh \
 | bash -s -- ~/path/to/your-project
```

Dry-run (no files written):
```bash
curl -fsSL https://raw.githubusercontent.com/zack-maz/bob-gsd/main/gsd-setup/install.sh \
 | bash -s -- ~/path/to/your-project --dry-run
```

---

## Already cloned?

```bash
gsd-setup/install.sh ~/path/to/your-project
```

---

## Contents

| File / Directory | Purpose |
|---|---|
| [`install.sh`](install.sh) | One-liner bootstrapper — curl entrypoint |
| [`scripts/deploy-gsd.sh`](scripts/deploy-gsd.sh) | Interactive installer (all platforms) |
| [`scripts/run-unattended.sh`](scripts/run-unattended.sh) | Autonomous loop driver (bash / macOS / Linux / Git Bash) |
| [`scripts/run-unattended.ps1`](scripts/run-unattended.ps1) | Autonomous loop driver (PowerShell) |
| [`scripts/run-unattended.bat`](scripts/run-unattended.bat) | Autonomous loop driver (cmd.exe) |
| [`scripts/gen-modes.sh`](scripts/gen-modes.sh) | Mode validator / regenerator |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Full deploy reference |
| [`test/`](test/) | Validation test suite |

---

## What gets installed

Running the installer copies into your target project:

- **`.gsd/`** — workflow state files (`PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, etc.)
- **`.bob/rules-*/`** — GSD mode behavioral guardrails
- **`.bob/custom_modes.yaml`** — GSD mode definitions Bob loads at runtime
- **`.gitignore`** — `.bob/notes/` entry appended (idempotent)

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for full details.

---

## Platforms

| Platform | Method |
|---|---|
| macOS | `curl \| bash` or direct |
| Linux | `curl \| bash` or direct |
| Windows (Git Bash / WSL) | `curl \| bash` or direct |
| Windows (native) | Use `scripts/run-unattended.bat` or `.ps1`; manual install for setup |

---

## After install

1. `cd` into your target project
2. Open a Bob session
3. Switch to **GSD Initializer** mode — Bob will interview you and write all `.gsd/` files
4. Switch to **GSD Orchestrator** and send: `"Advance the GSD workflow one step."`

For full details see [`docs/DEPLOY.md`](docs/DEPLOY.md).
