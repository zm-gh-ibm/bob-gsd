#!/usr/bin/env python3
"""
gen_modes.py
  Validates the single source of truth:
    .bob/gsd_modes.yaml

  This file lives at <repo>/gsd-setup/scripts/gen_modes.py
  REPO_ROOT resolves to <repo>/ (two levels up).

  Usage:
    python3 gsd-setup/scripts/gen_modes.py [--dry-run]
"""
import re
import sys
from pathlib import Path

# This script lives at <repo>/gsd-setup/scripts/gen_modes.py
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SOURCE    = REPO_ROOT / ".bob/gsd_modes.yaml"
BOB_DIR   = REPO_ROOT / ".bob"

dry_run = "--dry-run" in sys.argv


def extract_scalar(block: str, key: str) -> str:
    """
    Extract a simple key: value scalar.
    Handles both 2-space indent (  - slug: / name:) and 4-space indent (    key: value).
    """
    # Try 4-space indent first (most fields), then 2-space (slug inside list item)
    m = re.search(rf"^    {key}:\s*(.+)$", block, re.MULTILINE)
    if not m:
        m = re.search(rf"(?:^  - |^    ){key}:\s*(.+)$", block, re.MULTILINE)
    return m.group(1).strip() if m else ""


def extract_folded(block: str, key: str) -> str:
    """
    Extract a >- folded scalar.  Field lines start with 6 spaces.
    Returns the value with the leading 6-space indent stripped.
    """
    lines = block.split("\n")
    collecting = False
    result: list[str] = []
    for line in lines:
        if re.match(rf"^    {key}:\s*(>-)?$", line):
            collecting = True
            continue
        if collecting:
            if line == "" or line.startswith("      "):
                result.append(line[6:] if line.startswith("      ") else "")
            else:
                break
    return "\n".join(result).strip()


def extract_list(block: str, key: str) -> list[str]:
    """Extract a YAML list under a 4-space-indented key."""
    lines = block.split("\n")
    collecting = False
    items: list[str] = []
    for line in lines:
        if re.match(rf"^    {key}:", line):
            collecting = True
            continue
        if collecting:
            m = re.match(r"^      - (.+)$", line)
            if m:
                items.append(m.group(1))
            elif line.strip() == "":
                continue
            elif not line.startswith("      "):
                break
    return items


def write(path: Path, content: str) -> None:
    if dry_run:
        print(f"  [dry-run] would write: {path.relative_to(REPO_ROOT)}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print(f"  wrote: {path.relative_to(REPO_ROOT)}")


# ── load source ───────────────────────────────────────────────────────────────
if not SOURCE.exists():
    print(f"ERROR: source file not found: {SOURCE}", file=sys.stderr)
    sys.exit(1)

raw = SOURCE.read_text()

# Split into per-mode blocks at each "  - slug:" line
mode_blocks = re.split(r"(?=^  - slug:)", raw, flags=re.MULTILINE)[1:]
print(f"Found {len(mode_blocks)} modes in {SOURCE.relative_to(REPO_ROOT)}")
print(f"Source of truth: {SOURCE.relative_to(REPO_ROOT)}")
print(f"\n.bob/gsd_modes.yaml is already the source of truth and runtime copy.")
print(f"Edit it directly — no generation step needed.")

print(f"\nDone. {len(mode_blocks)} modes available.")
