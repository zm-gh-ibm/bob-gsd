#!/usr/bin/env bash
#
# run-unattended.sh
#   Drives the GSD Orchestrator unattended via BobShell (POSIX shell port of
#   run-unattended.ps1 / .bat).
#
#   Invokes:
#       bob --chat-mode gsd-orchestrator --approval-mode yolo \
#           "Advance the GSD workflow one step."
#   in a loop until one of four termination conditions is met:
#
#     1. Milestone complete  (phase_status=milestone-complete in STATE.md) -> exit 0
#     2. Blocker detected    (blockers: != none in STATE.md)               -> exit 1
#     3. bob exits non-zero  (hard error)                                  -> exit 1
#     4. Safety cap reached  (>= 50 iterations)                            -> exit 1
#
# Usage:  scripts/run-unattended.sh
set -uo pipefail

STATE_FILE=".planning/STATE.md"
MAX_ITER=50
iter=0

echo "============================================================"
echo " GSD Unattended Loop -- BobShell driver (bash)"
echo " State file : $STATE_FILE"
echo " Max iters  : $MAX_ITER"
echo "============================================================"
echo

# Read a single-line "key: value" from STATE.md (first match), trimmed.
read_state_value() {
  local key="$1"
  sed -n "s/^${key}:[[:space:]]*//p" "$STATE_FILE" | head -n1
}

# Tolerant blocker detection (see .planning/STATE.schema.md / D-8.3). A blocker may be
# written in EITHER form:
#   1. inline    ->  blockers: <non-none text>
#   2. YAML list ->  blockers:
#                      - "task-id: description"
# Cleared form is the single line `blockers: none`.
# Echoes the blocker detail and returns 0 when blocked, 1 when not.
get_blocker() {
  local in_section=0 line trimmed item
  while IFS= read -r line || [ -n "$line" ]; do
    if [ "$in_section" -eq 0 ]; then
      case "$line" in
        blockers:*)
          local inline="${line#blockers:}"
          inline="$(printf '%s' "$inline" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
          if [ -n "$inline" ]; then
            # inline form
            if [ "$(printf '%s' "$inline" | tr '[:upper:]' '[:lower:]')" = "none" ]; then
              return 1
            fi
            printf '%s' "$inline"
            return 0
          fi
          in_section=1   # empty inline value -> inspect following list items
          ;;
      esac
    else
      trimmed="$(printf '%s' "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
      case "$trimmed" in
        "" ) continue ;;                       # skip blank lines
        -* )
          item="${trimmed#-}"
          item="$(printf '%s' "$item" | sed 's/^[[:space:]]*//;s/^"//;s/"$//;s/^[[:space:]]*//;s/[[:space:]]*$//')"
          if [ -z "$item" ] || [ "$(printf '%s' "$item" | tr '[:upper:]' '[:lower:]')" = "none" ]; then
            return 1
          fi
          printf '%s' "$item"
          return 0
          ;;
        * ) return 1 ;;                        # section ended, no list item
      esac
    fi
  done < "$STATE_FILE"
  return 1
}

while true; do

  # --- Safety cap ---
  if [ "$iter" -ge "$MAX_ITER" ]; then
    echo
    echo "ABORTED: Safety cap of $MAX_ITER iterations reached."
    echo "Check $STATE_FILE to see where the workflow stopped."
    exit 1
  fi

  iter=$((iter + 1))

  # --- Read state ---
  phase_status="$(read_state_value phase_status)"
  blocker_detail="$(get_blocker)" && blocked=1 || blocked=0

  echo "------------------------------------------------------------"
  echo " Iteration $iter / $MAX_ITER   phase_status=$phase_status"
  echo "------------------------------------------------------------"

  # --- Blocker check (tolerant: inline OR YAML-list form) ---
  if [ "$blocked" -eq 1 ]; then
    echo
    echo "STOPPED: Blocker detected -- check $STATE_FILE"
    echo "Blocker value: $blocker_detail"
    exit 1
  fi

  # --- Milestone-complete check (before bob call) ---
  # The Shipper writes phase_status: milestone-complete as the ONLY accepted terminal
  # state (see .bob/rules-gsd-shipper/04-milestone-complete-signal.md).
  if [ "$(printf '%s' "$phase_status" | tr '[:upper:]' '[:lower:]')" = "milestone-complete" ]; then
    echo
    echo "SUCCESS: Milestone complete."
    exit 0
  fi

  # --- Invoke BobShell ---
  echo 'Running: bob --chat-mode gsd-orchestrator --approval-mode yolo "Advance the GSD workflow one step."'
  echo

  bob --chat-mode gsd-orchestrator --approval-mode yolo "Advance the GSD workflow one step."
  exit_code=$?

  if [ "$exit_code" -ne 0 ]; then
    echo
    echo "ERROR: bob exited non-zero (code $exit_code)"
    echo "Check BobShell output above for details."
    exit 1
  fi

  echo

  # --- Post-call milestone check ---
  phase_status="$(read_state_value phase_status)"
  if [ "$(printf '%s' "$phase_status" | tr '[:upper:]' '[:lower:]')" = "milestone-complete" ]; then
    echo "SUCCESS: Milestone complete."
    exit 0
  fi

done
