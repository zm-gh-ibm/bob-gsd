#!/usr/bin/env bash
#
# install.sh — GSD one-liner bootstrapper
#
#   Supports two modes:
#
#   1. Piped (curl | bash):
#      curl -fsSL https://raw.githubusercontent.com/zm-gh-ibm/bob-gsd/main/gsd-setup/install.sh | bash
#      → installs into the directory you ran the command from (no prompt needed)
#
#      curl -fsSL …/install.sh | bash -s -- ~/path/to/your-project
#      → installs into the specified path
#
#      curl -fsSL …/install.sh | bash -s -- ~/path/to/your-project --dry-run
#
#   2. Direct (already cloned):
#      gsd-setup/install.sh [<target-project-path>] [--dry-run]
#      → prompts for target if not supplied (stdin is a tty)
#
#   What it does:
#     a. If running piped (no local clone), clones bob-gsd to ~/tools/bob-gsd
#     b. Passes the caller's CWD as the default target to deploy-gsd.sh
#     c. Delegates to gsd-setup/scripts/deploy-gsd.sh <target> [--dry-run]
#
#   Platforms: macOS, Linux (bash 3.2+), Windows Git Bash / WSL
#
set -euo pipefail

# ── capture CWD immediately — before anything changes it ─────────────────────
ORIGINAL_PWD="$(pwd)"

# ── colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}  →${RESET} $*"; }
success() { echo -e "${GREEN}  ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}  ⚠${RESET} $*"; }
error()   { echo -e "${RED}  ✗ ERROR:${RESET} $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}$*${RESET}"; }

# ── GSD repo location ─────────────────────────────────────────────────────────
GSD_REPO_URL="https://github.com/zm-gh-ibm/bob-gsd.git"
GSD_DEFAULT_CLONE_DIR="$HOME/tools/bob-gsd"

# ── detect piped vs direct invocation ────────────────────────────────────────
# When piped via curl, BASH_SOURCE[0] is not a real file on disk.
SCRIPT_PATH="${BASH_SOURCE[0]:-}"
IS_PIPED=0
if [ -z "$SCRIPT_PATH" ] || [ ! -f "$SCRIPT_PATH" ]; then
  IS_PIPED=1
fi

# ── parse args ────────────────────────────────────────────────────────────────
TARGET=""
DRY_RUN_FLAG=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN_FLAG="--dry-run" ;;
    -*) error "Unknown flag: $arg" ;;
    *)
      if [ -z "$TARGET" ]; then
        TARGET="$arg"
      else
        error "Too many arguments. Usage: install.sh [<target-path>] [--dry-run]"
      fi
      ;;
  esac
done

# ── banner ────────────────────────────────────────────────────────────────────
echo
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║           GSD Workflow — Bootstrapper            ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${RESET}"
echo

# ── step 1: ensure GSD repo is available locally ─────────────────────────────
step "1/2  Locating GSD repo"

GSD_REPO=""

if [ "$IS_PIPED" -eq 0 ]; then
  # Running from a local clone — derive repo root from this script's location
  THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  GSD_REPO="$(cd "$THIS_DIR/.." && pwd)"
  success "Using local clone: $GSD_REPO"
else
  # Running piped — find or clone the repo
  if [ -d "$GSD_DEFAULT_CLONE_DIR/.git" ]; then
    info "Found existing clone at $GSD_DEFAULT_CLONE_DIR"
    GSD_REPO="$GSD_DEFAULT_CLONE_DIR"

    # Offer to pull latest
    if command -v git &>/dev/null; then
      echo
      read -r -p "  Pull latest changes? [Y/n] " pull_answer
      case "${pull_answer:-y}" in
        [nN]) info "Skipping pull." ;;
        *)
          info "Pulling latest..."
          git -C "$GSD_REPO" pull --ff-only || warn "Pull failed — continuing with existing version."
          ;;
      esac
    fi
  else
    info "No local clone found. Cloning to $GSD_DEFAULT_CLONE_DIR ..."
    echo "  Repo URL: $GSD_REPO_URL"
    echo "  Target  : $GSD_DEFAULT_CLONE_DIR"

    if ! command -v git &>/dev/null; then
      error "git is not on your PATH. Install git and retry."
    fi

    if [ -n "$DRY_RUN_FLAG" ]; then
      echo "    [dry] git clone $GSD_REPO_URL $GSD_DEFAULT_CLONE_DIR"
    else
      mkdir -p "$(dirname "$GSD_DEFAULT_CLONE_DIR")"
      git clone --depth 1 "$GSD_REPO_URL" "$GSD_DEFAULT_CLONE_DIR"
    fi

    GSD_REPO="$GSD_DEFAULT_CLONE_DIR"
    success "Cloned to $GSD_REPO"
  fi
fi

DEPLOY_SCRIPT="$GSD_REPO/gsd-setup/scripts/deploy-gsd.sh"

if [ ! -f "$DEPLOY_SCRIPT" ]; then
  # Fallback: support repos not yet migrated to gsd-setup/ layout
  DEPLOY_SCRIPT="$GSD_REPO/scripts/deploy-gsd.sh"
fi

if [ ! -f "$DEPLOY_SCRIPT" ]; then
  error "deploy-gsd.sh not found at expected paths in $GSD_REPO"
fi

# ── step 2: run deploy ────────────────────────────────────────────────────────
step "2/2  Running deploy-gsd.sh"
echo

# Build args for deploy script
# When no explicit target was given, pass the original CWD so deploy-gsd.sh
# always defaults to the directory the user was in when they ran the curl
# one-liner — even if stdin is not a tty and the interactive prompt is skipped.
DEPLOY_ARGS=()
if [ -n "$TARGET" ]; then
  DEPLOY_ARGS+=("$TARGET")
else
  DEPLOY_ARGS+=("$ORIGINAL_PWD")
fi
[ -n "$DRY_RUN_FLAG" ] && DEPLOY_ARGS+=("$DRY_RUN_FLAG")

chmod +x "$DEPLOY_SCRIPT"
exec "$DEPLOY_SCRIPT" "${DEPLOY_ARGS[@]}"
