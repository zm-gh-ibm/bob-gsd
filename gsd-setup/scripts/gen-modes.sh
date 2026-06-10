#!/usr/bin/env bash
#
# gen-modes.sh
#   Thin wrapper around scripts/gen_modes.py
#   Validates and reports on the mode definitions from the single source of truth:
#     .bob/gsd_modes.yaml
#
#   The source of truth IS the runtime copy — edit .bob/gsd_modes.yaml directly.
#
#   Usage:
#     scripts/gen-modes.sh [--dry-run]
#
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/gen_modes.py" "$@"
