#!/usr/bin/env bash
#
# deploy-gsd.sh
#   Installs the GSD workflow into a target project.
#
#   What it does:
#     1. Copies .gsd/ scaffold (STATE, REQUIREMENTS, ROADMAP, PROJECT, CONTEXT,
#        VERIFY, STATE.schema, modes/) into <target>/.gsd/
#     2. Copies .bob/rules-*/ into <target>/.bob/
#     3. Installs custom_modes.yaml to project scope (.bob/) or global scope
#        (~/.bob/) — you choose interactively
#     4. Appends .gitignore.snippet entries to <target>/.gitignore (idempotent)
#
#   Requirements: bash 3.2+, python3, bob on PATH (optional — warned if absent)
#   Platforms:    macOS, Linux, Windows (Git Bash / WSL)
#
#   Usage:
#     gsd-setup/scripts/deploy-gsd.sh [<target-project-path>] [--dry-run]
#
#   Or via the one-liner bootstrapper:
#     gsd-setup/install.sh [<target-project-path>] [--dry-run]
#
set -euo pipefail

# ── colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}  →${RESET} $*"; }
success() { echo -e "${GREEN}  ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}  ⚠${RESET} $*"; }
error()   { echo -e "${RED}  ✗ ERROR:${RESET} $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}$*${RESET}"; }

# ── OS detection (informational, no guard) ────────────────────────────────────
OS_TYPE="$(uname -s 2>/dev/null || echo "Unknown")"
case "$OS_TYPE" in
  Darwin)  OS_LABEL="macOS" ;;
  Linux)   OS_LABEL="Linux" ;;
  MINGW*|MSYS*|CYGWIN*) OS_LABEL="Windows (Git Bash)" ;;
  *)       OS_LABEL="$OS_TYPE" ;;
esac

# ── parse args ────────────────────────────────────────────────────────────────
TARGET=""
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -*) error "Unknown flag: $arg" ;;
    *)
      if [ -z "$TARGET" ]; then
        TARGET="$arg"
      else
        error "Too many arguments. Usage: deploy-gsd.sh [<target-path>] [--dry-run]"
      fi
      ;;
  esac
done

# ── locate GSD repo root ──────────────────────────────────────────────────────
# This script lives at <repo>/gsd-setup/scripts/deploy-gsd.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GSD_REPO="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── target path ───────────────────────────────────────────────────────────────
if [ -z "$TARGET" ]; then
  echo
  echo -e "${BOLD}GSD Deploy — target project path${RESET}"
  echo "  Enter the path to the project you want to install GSD into."
  echo "  Press Enter to use the current directory: $(pwd)"
  echo
  read -r -p "  Target path: " input_path
  TARGET="${input_path:-$(pwd)}"
fi

# Expand ~ and resolve to absolute path
TARGET="$(eval echo "$TARGET")"
TARGET="$(cd "$TARGET" 2>/dev/null && pwd)" \
  || error "Target path does not exist: $TARGET"

if [ "$TARGET" = "$GSD_REPO" ]; then
  error "Target cannot be the GSD repo itself."
fi

# ── dry-run banner ────────────────────────────────────────────────────────────
if [ "$DRY_RUN" -eq 1 ]; then
  echo -e "\n${YELLOW}  ── DRY RUN — no files will be written ──${RESET}\n"
fi

# ── banner ────────────────────────────────────────────────────────────────────
echo
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║            GSD Workflow Installer                ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${RESET}"
echo
echo -e "  Platform    : ${CYAN}$OS_LABEL${RESET}"
echo -e "  Source repo : ${CYAN}$GSD_REPO${RESET}"
echo -e "  Target      : ${CYAN}$TARGET${RESET}"
echo

# ── check prerequisites ───────────────────────────────────────────────────────
step "1/5  Checking prerequisites"

if ! command -v bob &>/dev/null; then
  warn "'bob' is not on your PATH. GSD will be installed but you won't be able"
  warn "to run it until Bob CLI is installed. See https://bob.ai for installation."
else
  success "bob found: $(command -v bob)"
fi

if ! command -v python3 &>/dev/null; then
  warn "'python3' is not on your PATH. The mode-merge step requires python3."
  warn "Install python3 from https://python.org and re-run if merge is needed."
  HAVE_PYTHON=0
else
  success "python3 found: $(command -v python3)"
  HAVE_PYTHON=1
fi

# ── ask: modes scope ──────────────────────────────────────────────────────────
step "2/5  Mode installation scope"
echo
echo "  Where should the GSD custom modes (gsd-orchestrator, gsd-executor, etc.) be"
echo "  installed?"
echo
echo "    [1] Project-scoped  — only for this project"
echo "        Writes to: $TARGET/.bob/custom_modes.yaml"
echo
echo "    [2] Global          — available in every Bob project"
echo "        Writes to: ~/.bob/custom_modes.yaml"
echo
read -r -p "  Choice [1/2]: " scope_choice

case "$scope_choice" in
  2)
    MODES_DEST="$HOME/.bob/custom_modes.yaml"
    MODES_SCOPE="global"
    ;;
  *)
    MODES_DEST="$TARGET/.bob/custom_modes.yaml"
    MODES_SCOPE="project"
    ;;
esac

echo
info "Modes will be installed ${BOLD}${MODES_SCOPE}-scoped${RESET} → $MODES_DEST"

# ── confirm ───────────────────────────────────────────────────────────────────
echo
echo -e "${BOLD}  The following will be written:${RESET}"
echo "    $TARGET/.gsd/                 (workflow state files)"
echo "    $TARGET/.bob/rules-*/         (mode behavioral rules)"
echo "    $MODES_DEST                   (custom modes)"
echo "    $TARGET/.gitignore            (appended: .bob/notes/ entry)"
echo
read -r -p "  Proceed? [y/N] " confirm
case "$confirm" in
  [yY]|[yY][eE][sS]) ;;
  *) echo "  Aborted."; exit 0 ;;
esac

# ── helper: dry-aware operations ──────────────────────────────────────────────
do_mkdir() {
  if [ "$DRY_RUN" -eq 0 ]; then
    mkdir -p "$1"
  else
    echo "    [dry] mkdir -p $1"
  fi
}

do_cp() {
  # do_cp <src> <dest_dir>
  if [ "$DRY_RUN" -eq 0 ]; then
    mkdir -p "$2"
    cp -R "$1" "$2/"
  else
    echo "    [dry] cp -R $1 → $2/"
  fi
}

# ── step 3: install .gsd/ scaffold ───────────────────────────────────────────
step "3/5  Installing .gsd/ scaffold"

GSD_SCAFFOLD="$GSD_REPO/.gsd"
GSD_DEST="$TARGET/.gsd"

# Guard: don't overwrite an already-initialized project (has real content in PROJECT.md)
SKIP_SCAFFOLD=0
if [ -f "$GSD_DEST/PROJECT.md" ]; then
  existing=$(grep -v "^#\|^$\|<!--" "$GSD_DEST/PROJECT.md" 2>/dev/null | head -3)
  if [ -n "$existing" ]; then
    warn "$GSD_DEST/PROJECT.md exists and appears to have content."
    warn "Skipping .gsd/ scaffold to protect existing project state."
    warn "Delete .gsd/PROJECT.md manually to force a fresh install."
    SKIP_SCAFFOLD=1
  fi
fi

if [ "$SKIP_SCAFFOLD" -eq 0 ]; then
  for f in PROJECT.md REQUIREMENTS.md ROADMAP.md STATE.md STATE.schema.md CONTEXT.md VERIFY.md; do
    src="$GSD_SCAFFOLD/$f"
    if [ -f "$src" ]; then
      do_mkdir "$GSD_DEST"
      if [ "$DRY_RUN" -eq 0 ]; then
        cp "$src" "$GSD_DEST/$f"
      else
        echo "    [dry] cp $src → $GSD_DEST/$f"
      fi
      info "  $f"
    fi
  done

  if [ -d "$GSD_SCAFFOLD/modes" ]; then
    if [ "$DRY_RUN" -eq 0 ]; then
      mkdir -p "$GSD_DEST"
      cp -R "$GSD_SCAFFOLD/modes" "$GSD_DEST/modes"
    else
      echo "    [dry] cp -R $GSD_SCAFFOLD/modes → $GSD_DEST/modes"
    fi
    info "  modes/ (yaml + docs)"
  fi

  success ".gsd/ scaffold installed"
fi

# ── step 4: install .bob/rules-*/ ────────────────────────────────────────────
step "4/5  Installing .bob/ rules"

BOB_SRC="$GSD_REPO/.bob"
BOB_DEST="$TARGET/.bob"

for rules_dir in "$BOB_SRC"/rules-*/; do
  dir_name="$(basename "$rules_dir")"
  dest_dir="$BOB_DEST/$dir_name"
  if [ "$DRY_RUN" -eq 0 ]; then
    mkdir -p "$dest_dir"
    cp "$rules_dir"*.md "$dest_dir/" 2>/dev/null || true
  else
    echo "    [dry] cp $rules_dir*.md → $dest_dir/"
  fi
  info "  $dir_name/"
done

success ".bob/rules-*/ installed"

# ── step 5a: install custom_modes.yaml ───────────────────────────────────────
step "5/5  Installing custom modes ($MODES_SCOPE)"

MODES_SRC="$GSD_REPO/.bob/gsd_modes.yaml"

if [ -f "$MODES_DEST" ]; then
  warn "$(basename "$MODES_DEST") already exists at $MODES_DEST"
  echo
  echo "  Options:"
  echo "    [1] Overwrite (replace with GSD modes)"
  echo "    [2] Merge     (append GSD modes not already present)"
  echo "    [3] Skip      (leave existing file untouched)"
  echo
  read -r -p "  Choice [1/2/3]: " merge_choice

  case "${merge_choice:-1}" in
    2)
      if [ "$HAVE_PYTHON" -eq 0 ]; then
        warn "python3 not available — falling back to overwrite."
        # Fall through to overwrite
        if [ "$DRY_RUN" -eq 0 ]; then
          mkdir -p "$(dirname "$MODES_DEST")"
          cp "$MODES_SRC" "$MODES_DEST"
        else
          echo "    [dry] cp $MODES_SRC → $MODES_DEST"
        fi
        success "Modes installed (overwrite fallback — no python3)"
      else
        info "Merging GSD modes into existing $MODES_DEST ..."
        if [ "$DRY_RUN" -eq 0 ]; then
          python3 - "$MODES_SRC" "$MODES_DEST" << 'PYEOF'
import re, sys
src_path, dest_path = sys.argv[1], sys.argv[2]

with open(src_path) as f:
    src = f.read()
with open(dest_path) as f:
    dest = f.read()

existing_slugs = set(re.findall(r"slug:\s*(\S+)", dest))
print(f"  Existing slugs in dest: {sorted(existing_slugs)}")

blocks = re.split(r"(?=^  - slug:)", src, flags=re.MULTILINE)[1:]

added = 0
append_lines = []
for block in blocks:
    m = re.search(r"(?:^  - |^    )slug:\s*(\S+)$", block, re.MULTILINE)
    if not m:
        continue
    slug = m.group(1)
    if slug in existing_slugs:
        print(f"  skipping {slug} (already present)")
        continue
    append_lines.append(block.rstrip())
    added += 1
    print(f"  appending {slug}")

# Back up before mutating
import shutil, datetime
bak = dest_path + '.bak-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
shutil.copy2(dest_path, bak)
print(f"  backed up existing file → {bak}")

if append_lines:
    with open(dest_path, "a") as f:
        f.write("\n")
        for bl in append_lines:
            f.write(bl + "\n")

print(f"  Done. Added {added} mode(s).")
PYEOF
        else
          echo "    [dry] merge GSD modes into $MODES_DEST"
        fi
        success "Modes merged"
      fi
      ;;
    3)
      warn "Skipping modes installation."
      ;;
    *)
      # Overwrite
      if [ "$DRY_RUN" -eq 0 ]; then
        mkdir -p "$(dirname "$MODES_DEST")"
        cp "$MODES_SRC" "$MODES_DEST"
      else
        echo "    [dry] cp $MODES_SRC → $MODES_DEST"
      fi
      success "Modes installed (overwrite)"
      ;;
  esac
else
  if [ "$DRY_RUN" -eq 0 ]; then
    mkdir -p "$(dirname "$MODES_DEST")"
    cp "$MODES_SRC" "$MODES_DEST"
  else
    echo "    [dry] cp $MODES_SRC → $MODES_DEST"
  fi
  success "Modes installed → $MODES_DEST"
fi

# ── step 5b: .gitignore ───────────────────────────────────────────────────────
GITIGNORE="$TARGET/.gitignore"
SNIPPET_MARKER="# GSD — bob notes"

if grep -qF "$SNIPPET_MARKER" "$GITIGNORE" 2>/dev/null; then
  info ".gitignore already contains GSD entries — skipping"
else
  # Source the snippet from the canonical location in gsd-setup/
  SNIPPET_FILE="$GSD_REPO/gsd-setup/.gitignore.snippet"
  # Fallback to repo root for backward compatibility
  [ -f "$SNIPPET_FILE" ] || SNIPPET_FILE="$GSD_REPO/gitignore.snippet"

  GITIGNORE_BLOCK="
$SNIPPET_MARKER
# bob rewrites this on every commit; ignore it to keep the working tree clean.
.bob/notes/
"
  if [ "$DRY_RUN" -eq 0 ]; then
    printf '%s' "$GITIGNORE_BLOCK" >> "$GITIGNORE"
    success ".gitignore updated"
  else
    echo "    [dry] append GSD block to $GITIGNORE"
  fi
fi

# ── done ──────────────────────────────────────────────────────────────────────
echo
echo -e "${GREEN}${BOLD}  ✓ GSD installed successfully${RESET}"
echo
echo -e "${BOLD}  Next steps:${RESET}"
echo "    1. cd $TARGET"
echo "    2. Open a Bob session in that directory"
if [ "$MODES_SCOPE" = "global" ]; then
  echo "    3. Modes are available globally — no further setup needed"
else
  echo "    3. Bob will load modes from .bob/custom_modes.yaml automatically"
fi
echo "    4. Switch to 'GSD Initializer' mode and run the project interview"
echo "    5. After init, switch to 'GSD Orchestrator' and send:"
echo "       \"Advance the GSD workflow one step.\""
echo
echo "  To run unattended (after init + planning approval):"
echo "    gsd-setup/scripts/run-unattended.sh   (from the target project directory)"
echo
