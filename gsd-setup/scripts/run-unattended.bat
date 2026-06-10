@echo off
:: ============================================================
:: run-unattended.bat
:: Drives the GSD Orchestrator unattended via BobShell.
::
:: Invokes:
::   bob --chat-mode gsd-orchestrator --approval-mode yolo
::       "Advance the GSD workflow one step."
::
:: Stops when:
::   1. Milestone complete  (phase_status=milestone-complete in STATE.md) -> exit 0
::   2. Blocker detected    (blockers: != none in STATE.md)          -> exit 1
::   3. bob exits non-zero  (hard error)                             -> exit 1
::   4. Safety cap reached  (>= 50 iterations)                       -> exit 1
:: ============================================================

setlocal EnableDelayedExpansion

set STATE_FILE=.gsd\STATE.md
set ROADMAP_FILE=.gsd\ROADMAP.md
set MAX_ITER=50
set ITER=0

echo ============================================================
echo  GSD Unattended Loop -- BobShell driver
echo  State file : %STATE_FILE%
echo  Max iters  : %MAX_ITER%
echo ============================================================
echo.

:loop

:: --- Safety cap check ---
if !ITER! GEQ %MAX_ITER% (
    echo.
    echo ABORTED: Safety cap of %MAX_ITER% iterations reached.
    echo Check .gsd/STATE.md to see where the workflow stopped.
    exit /b 1
)

set /a ITER+=1

:: --- Read phase_status from STATE.md ---
set PHASE_STATUS=unknown
for /f "tokens=2 delims=: " %%A in ('findstr /b "phase_status:" %STATE_FILE%') do (
    set PHASE_STATUS=%%A
)

:: --- Read blockers (tolerant: inline value OR YAML-list form) ---
:: Canonical clear form is the single line "blockers: none". A present blocker is
:: either inline ("blockers: <text>") or a YAML list ("blockers:" + "  - <item>").
:: tokens=1,* delims=: keeps everything after the first colon, so a blocker detail
:: that itself contains a colon ("2.2: build fails") is preserved. An EMPTY inline
:: value means the list form -> treat as blocked (fail-safe; see D-8.3 / risk R2:
:: cmd cannot reliably look ahead to a "- none" item, but the canonical writer never
:: emits one -- cleared is always the inline "none").
set BLOCKED=0
set BLOCKER_DETAIL=
set BLOCKERS_INLINE=
for /f "tokens=1,* delims=:" %%A in ('findstr /b /c:"blockers:" %STATE_FILE%') do set BLOCKERS_INLINE=%%B
:: trim leading spaces from the inline value
for /f "tokens=* delims= " %%A in ("!BLOCKERS_INLINE!") do set BLOCKERS_INLINE=%%A

if defined BLOCKERS_INLINE (
    if /i NOT "!BLOCKERS_INLINE!"=="none" (
        set BLOCKED=1
        set BLOCKER_DETAIL=!BLOCKERS_INLINE!
    )
) else (
    set BLOCKED=1
    set BLOCKER_DETAIL=YAML-list form -- see %STATE_FILE%
)

echo ------------------------------------------------------------
echo  Iteration !ITER! / %MAX_ITER%   phase_status=!PHASE_STATUS!
echo ------------------------------------------------------------

:: --- Blocker check (tolerant: inline OR YAML-list form) ---
if "!BLOCKED!"=="1" (
    echo.
    echo STOPPED: Blocker detected -- check .gsd/STATE.md
    echo Blocker value: !BLOCKER_DETAIL!
    exit /b 1
)

:: --- Milestone-complete check (before invoking bob) ---
:: The Shipper writes phase_status: milestone-complete as the ONLY accepted
:: terminal state (see .bob/rules-gsd-shipper/04-milestone-complete-signal.md).
if /i "!PHASE_STATUS!"=="milestone-complete" (
    echo.
    echo SUCCESS: Milestone complete.
    exit /b 0
)

:: --- Invoke BobShell ---
echo Running: bob --chat-mode gsd-orchestrator --approval-mode yolo "Advance the GSD workflow one step."
echo.

bob --chat-mode gsd-orchestrator --approval-mode yolo "Advance the GSD workflow one step."
set BOB_EXIT=%ERRORLEVEL%

if !BOB_EXIT! NEQ 0 (
    echo.
    echo ERROR: bob exited non-zero (code !BOB_EXIT!)
    echo Check BobShell output above for details.
    exit /b 1
)

echo.

:: --- Post-call milestone check ---
for /f "tokens=2 delims=: " %%A in ('findstr /b "phase_status:" %STATE_FILE%') do (
    set PHASE_STATUS=%%A
)

if /i "!PHASE_STATUS!"=="milestone-complete" (
    echo SUCCESS: Milestone complete.
    exit /b 0
)

:: --- Loop ---
goto loop
