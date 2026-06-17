<#
.SYNOPSIS
    Drives the GSD Orchestrator unattended via BobShell (PowerShell wrapper).

.DESCRIPTION
    Invokes:
        bob --chat-mode gsd-orchestrator --approval-mode yolo
            "Advance the GSD workflow one step."
    in a loop until one of four termination conditions is met:

    1. Milestone complete  (phase_status=milestone-complete in STATE.md) -> exit 0
    2. Blocker detected    (blockers: != none in STATE.md)          -> exit 1
    3. bob exits non-zero  (hard error)                             -> exit 1
    4. Safety cap reached  (>= 50 iterations)                       -> exit 1

.EXAMPLE
    .\scripts\run-unattended.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$StateFile   = ".planning\STATE.md"
$RoadmapFile = ".planning\ROADMAP.md"
$MaxIter     = 50
$iter        = 0

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " GSD Unattended Loop -- BobShell driver (PowerShell)"        -ForegroundColor Cyan
Write-Host " State file : $StateFile"                                     -ForegroundColor Cyan
Write-Host " Max iters  : $MaxIter"                                       -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

function Read-StateValue {
    param([string]$Key)
    $line = Get-Content $StateFile | Where-Object { $_ -match "^${Key}:" } | Select-Object -First 1
    if ($line) {
        return ($line -replace "^${Key}:\s*", "").Trim()
    }
    return $null
}

# Tolerant blocker detection: a blocker may be written in EITHER form (see
# .planning/STATE.schema.md / D-8.3):
#   1. inline      ->  blockers: <non-none text>
#   2. YAML list   ->  blockers:
#                        - "task-id: description"
# The cleared form is the single line `blockers: none`. Returns a hashtable
# @{ Blocked = <bool>; Detail = <string> }.
function Get-BlockerStatus {
    $lines = @(Get-Content $StateFile)
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^blockers:\s*(.*)$') {
            $inline = $Matches[1].Trim()
            if ($inline -ne '') {
                # inline form
                if ($inline -ieq 'none') { return @{ Blocked = $false; Detail = '' } }
                return @{ Blocked = $true; Detail = $inline }
            }
            # empty inline value -> look ahead for the first YAML list item
            for ($j = $i + 1; $j -lt $lines.Count; $j++) {
                if ($lines[$j] -match '^\s*-\s*(.*)$') {
                    $item = $Matches[1].Trim().Trim('"').Trim()
                    if ($item -ieq 'none' -or $item -eq '') { return @{ Blocked = $false; Detail = '' } }
                    return @{ Blocked = $true; Detail = $item }
                }
                elseif ($lines[$j] -match '^\s*$') { continue }   # skip blank lines
                else { break }                                    # section ended, no list item
            }
            return @{ Blocked = $false; Detail = '' }
        }
    }
    return @{ Blocked = $false; Detail = '' }
}

while ($true) {

    # --- Safety cap ---
    if ($iter -ge $MaxIter) {
        Write-Host ""
        Write-Host "ABORTED: Safety cap of $MaxIter iterations reached." -ForegroundColor Red
        Write-Host "Check $StateFile to see where the workflow stopped."
        exit 1
    }

    $iter++

    # --- Read state ---
    $phaseStatus = Read-StateValue "phase_status"
    $blocker     = Get-BlockerStatus

    Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host " Iteration $iter / $MaxIter   phase_status=$phaseStatus"     -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

    # --- Blocker check (tolerant: inline OR YAML-list form) ---
    if ($blocker.Blocked) {
        Write-Host ""
        Write-Host "STOPPED: Blocker detected -- check $StateFile" -ForegroundColor Red
        Write-Host "Blocker value: $($blocker.Detail)"
        exit 1
    }

    # --- Milestone-complete check (before bob call) ---
    # The Shipper writes phase_status: milestone-complete as the ONLY accepted
    # terminal state (see .bob/rules-gsd-shipper/04-milestone-complete-signal.md).
    if ($phaseStatus -ieq "milestone-complete") {
        Write-Host ""
        Write-Host "SUCCESS: Milestone complete." -ForegroundColor Green
        exit 0
    }

    # --- Invoke BobShell ---
    Write-Host "Running: bob --chat-mode gsd-orchestrator --approval-mode yolo `"Advance the GSD workflow one step.`""
    Write-Host ""

    & bob --chat-mode gsd-orchestrator --approval-mode yolo "Advance the GSD workflow one step."
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        Write-Host ""
        Write-Host "ERROR: bob exited non-zero (code $exitCode)" -ForegroundColor Red
        Write-Host "Check BobShell output above for details."
        exit 1
    }

    Write-Host ""

    # --- Post-call milestone check ---
    $phaseStatus = Read-StateValue "phase_status"

    if ($phaseStatus -ieq "milestone-complete") {
        Write-Host "SUCCESS: Milestone complete." -ForegroundColor Green
        exit 0
    }
}
