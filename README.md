# bob-gsd

> **GSD** (Get Stuff Done) — an autonomous AI workflow for Bob that drives projects
> from requirements to shipped code, one phase at a time.

---

## Setup — true one-liner

```bash
curl -fsSL https://raw.githubusercontent.com/zack-maz/bob-gsd/main/gsd-setup/install.sh | bash
```

With a target path or dry-run:
```bash
curl -fsSL https://raw.githubusercontent.com/zack-maz/bob-gsd/main/gsd-setup/install.sh \
  | bash -s -- ~/path/to/your-project [--dry-run]
```

Or if you've already cloned this repo:
```bash
gsd-setup/install.sh ~/path/to/your-project
```

---

## Documentation

All user-facing setup files live in [`gsd-setup/`](gsd-setup/):

| File | Purpose |
|---|---|
| [`gsd-setup/README.md`](gsd-setup/README.md) | Full setup guide (start here) |
| [`gsd-setup/docs/DEPLOY.md`](gsd-setup/docs/DEPLOY.md) | Full deploy reference |
| [`gsd-setup/install.sh`](gsd-setup/install.sh) | One-liner bootstrapper (curl entrypoint) |
| [`gsd-setup/scripts/deploy-gsd.sh`](gsd-setup/scripts/deploy-gsd.sh) | Interactive installer |
| [`gsd-setup/scripts/run-unattended.sh`](gsd-setup/scripts/run-unattended.sh) | Autonomous loop driver (bash) |
| [`gsd-setup/scripts/run-unattended.ps1`](gsd-setup/scripts/run-unattended.ps1) | Autonomous loop driver (PowerShell) |
| [`gsd-setup/scripts/run-unattended.bat`](gsd-setup/scripts/run-unattended.bat) | Autonomous loop driver (cmd.exe) |
| [`gsd-setup/test/`](gsd-setup/test/) | Validation test suite |

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
    install.sh            ← one-liner bootstrapper
    scripts/              ← deploy + loop driver scripts (all platforms)
    docs/                 ← deploy reference docs
    test/                 ← validation test suite
    .gitignore.snippet    ← appended to target .gitignore on install

  .gsd/                   ← scaffold templates (copied into target projects)
  .bob/                   ← GSD mode definitions + rules (copied into target projects)
```
