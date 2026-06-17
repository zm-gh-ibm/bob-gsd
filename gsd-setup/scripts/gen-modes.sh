#!/usr/bin/env bash
#
# gen-modes.sh
#   Thin wrapper around scripts/gen_modes.py
#   Validates and reports on the mode definitions from the single source of truth:
#     gsd-setup/template/.bob/gsd_modes.yaml
#
#   Edit gsd-setup/template/.bob/gsd_modes.yaml directly.
#   deploy-gsd.sh copies it to <target>/.bob/gsd_modes.yaml on install.
#
#   Usage:
#     scripts/gen-modes.sh [--dry-run]
#
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/gen_modes.py" "$@"
