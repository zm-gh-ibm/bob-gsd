/**
 * gsd-setup/test/validate-loop.js
 *
 * Validates the BobShell unattended-loop scripts: content checks, executable
 * behavioral tests, and (when gsd-bob/ is present) full bundle assertions.
 *
 * Usage:  node gsd-setup/test/validate-loop.js
 * Exit:   0 = all assertions pass
 *         1 = one or more assertions fail
 */

'use strict';

const fs   = require('node:fs');
const os   = require('node:os');
const path = require('node:path');
const { execSync, spawnSync } = require('node:child_process');

// ── root references ───────────────────────────────────────────────────────────
// This file lives at  <repo>/gsd-setup/test/validate-loop.js
// GSD_SETUP_DIR  = <repo>/gsd-setup/
// GSD_REPO_ROOT  = <repo>/          (contains .bob/, .gsd/, gsd-bob/)

const GSD_SETUP_DIR = path.resolve(__dirname, '..');
const GSD_REPO_ROOT = path.resolve(__dirname, '../..');

// ── helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

function assert(id, description, condition, detail = '') {
  if (condition) {
    results.push({ id, description, result: 'PASS', detail: '' });
    passed++;
  } else {
    results.push({ id, description, result: 'FAIL', detail });
    failed++;
  }
}

// SKIP: a check that can't run here (e.g. an interpreter is unavailable). Not a failure.
function skip(id, description, detail = '') {
  results.push({ id, description, result: 'SKIP', detail });
  skipped++;
}

// Is an external command available? (trivial invocation, exit 0)
function haveCmd(cmd, args) {
  try { return spawnSync(cmd, args, { encoding: 'utf8', timeout: 10000 }).status === 0; }
  catch (e) { return false; }
}

// readFile: resolve relative to gsd-setup/ (scripts/, docs/, test/)
function readFile(filePath) {
  const abs = path.resolve(GSD_SETUP_DIR, filePath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

// readRepoFile: resolve relative to repo root (.bob/, .gsd/)
function readRepoFile(filePath) {
  const abs = path.resolve(GSD_REPO_ROOT, filePath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

// ── assertions ────────────────────────────────────────────────────────────────

// A-1  Batch script exists
const batContent = readFile('scripts/run-unattended.bat');
assert(
  'A-1',
  'scripts/run-unattended.bat exists',
  batContent !== null,
  'File not found at scripts/run-unattended.bat'
);

// A-2  PowerShell script exists
const ps1Content = readFile('scripts/run-unattended.ps1');
assert(
  'A-2',
  'scripts/run-unattended.ps1 exists',
  ps1Content !== null,
  'File not found at scripts/run-unattended.ps1'
);

// ── Batch script termination-condition checks (A-3 through A-6) ───────────────

const bat = batContent || '';

assert(
  'A-3',
  'run-unattended.bat: milestone termination present (string "milestone")',
  bat.toLowerCase().includes('milestone'),
  'Expected "milestone" string not found in run-unattended.bat'
);

assert(
  'A-4',
  'run-unattended.bat: blocker termination present (string "blocker")',
  bat.toLowerCase().includes('blocker'),
  'Expected "blocker" string not found in run-unattended.bat'
);

assert(
  'A-5',
  'run-unattended.bat: safety cap present (string "50")',
  bat.includes('50'),
  'Expected iteration cap "50" not found in run-unattended.bat'
);

assert(
  'A-6',
  'run-unattended.bat: bob error handling present (ERRORLEVEL check)',
  bat.includes('ERRORLEVEL'),
  'Expected "ERRORLEVEL" check not found in run-unattended.bat'
);

// ── PowerShell script termination-condition checks (A-7 through A-10) ─────────

const ps1 = ps1Content || '';

assert(
  'A-7',
  'run-unattended.ps1: milestone termination present (string "milestone")',
  ps1.toLowerCase().includes('milestone'),
  'Expected "milestone" string not found in run-unattended.ps1'
);

assert(
  'A-8',
  'run-unattended.ps1: blocker termination present (string "blocker")',
  ps1.toLowerCase().includes('blocker'),
  'Expected "blocker" string not found in run-unattended.ps1'
);

assert(
  'A-9',
  'run-unattended.ps1: safety cap present (string "50")',
  ps1.includes('50'),
  'Expected iteration cap "50" not found in run-unattended.ps1'
);

assert(
  'A-10',
  'run-unattended.ps1: bob error handling present ($exitCode check)',
  ps1.includes('$exitCode') || ps1.includes('$LASTEXITCODE'),
  'Expected "$exitCode" or "$LASTEXITCODE" check not found in run-unattended.ps1'
);

// ── Canonical terminal-state checks (A-13, A-14) ─────────────────────────────
// The Shipper writes phase_status: milestone-complete as the ONLY accepted terminal
// state. Both scripts must detect that exact string — NOT the old "shipped + no
// pending phase" heuristic, which never fired because the Shipper writes
// milestone-complete (not shipped) on the final phase.

assert(
  'A-13',
  'run-unattended.bat: detects canonical terminal state ("milestone-complete")',
  bat.includes('milestone-complete'),
  'Expected "milestone-complete" terminal check not found in run-unattended.bat'
);

assert(
  'A-14',
  'run-unattended.ps1: detects canonical terminal state ("milestone-complete")',
  ps1.includes('milestone-complete'),
  'Expected "milestone-complete" terminal check not found in run-unattended.ps1'
);

// ── A-11: bob is on PATH ──────────────────────────────────────────────────────

let bobOnPath = false;
let bobVersion = '';
try {
  bobVersion = execSync('bob --version', { encoding: 'utf8', timeout: 10000 }).trim();
  bobOnPath  = bobVersion.length > 0;
} catch (e) {
  bobOnPath = false;
}

assert(
  'A-11',
  `bob is on PATH and responds (version: ${bobVersion || 'n/a'})`,
  bobOnPath,
  'bob --version failed or returned empty output'
);

// ── A-12: bob --help lists ALL SIX GSD modes as valid chat-modes ──────────────
// A project must vendor the complete .bob/custom_modes.yaml; the global store may be
// missing gsd-verifier/gsd-shipper (Phase 7 defect F-3). This preflight asserts every
// slug resolves before a live run — see docs/DEPLOY.md.

const GSD_MODES = [
  'gsd-init',
  'gsd-planner',
  'gsd-executor',
  'gsd-verifier',
  'gsd-shipper',
  'gsd-orchestrator',
];

let helpText = '';
try {
  helpText = execSync('bob --help', { encoding: 'utf8', timeout: 10000 });
} catch (e) {
  helpText = '';
}

const missingModes = GSD_MODES.filter((m) => !helpText.includes(m));

assert(
  'A-12',
  'bob --help lists all six GSD modes as valid --chat-mode choices',
  helpText !== '' && missingModes.length === 0,
  helpText === ''
    ? 'bob --help failed or returned empty output'
    : `Missing GSD mode(s) in bob --help: ${missingModes.join(', ')} — vendor the complete .bob/custom_modes.yaml (see docs/DEPLOY.md)`
);

// ── Behavioral fixtures: actually EXECUTE the scripts (A-15…A-20) ─────────────
// Phase 5's validator only string-matched script contents, which is why F-6 (the
// script did not even parse) and F-4 (list-form blocker not detected) shipped. These
// assertions run each script against fixture STATE.md files and check exit code +
// output. All fixtures use a terminal or blocker phase_status that short-circuits
// BEFORE any `bob` call, so the test stays fast and offline.

const FIXTURE_TERMINAL = [
  '# STATE',
  'milestone: v1',
  'current_phase: 3',
  'phase_status: milestone-complete',
  'last_completed_task: 3.4',
  'open_decisions:',
  '  - none',
  'blockers: none',
  '',
].join('\n');

const FIXTURE_BLOCKER_INLINE = [
  '# STATE',
  'milestone: v1',
  'current_phase: 2',
  'phase_status: executing',
  'last_completed_task: 2.1',
  'open_decisions:',
  '  - none',
  'blockers: some-fault',
  '',
].join('\n');

const FIXTURE_BLOCKER_LIST = [
  '# STATE',
  'milestone: v1',
  'current_phase: 2',
  'phase_status: executing',
  'last_completed_task: 2.1',
  'open_decisions:',
  '  - none',
  'blockers:',
  '  - "2.2: build fails on missing dep"',
  '',
].join('\n');

const BAT_ABS = path.resolve(GSD_SETUP_DIR, 'scripts', 'run-unattended.bat');
const PS1_ABS = path.resolve(GSD_SETUP_DIR, 'scripts', 'run-unattended.ps1');

// Detect available runtimes for behavioral fixture tests (A-15–A-20).
// .bat requires cmd.exe (Windows only); .ps1 requires powershell (Windows / macOS with pwsh).
const isWindows  = os.platform() === 'win32';
const hasCmdExe  = isWindows && haveCmd('cmd', ['/c', 'echo ok']);
const hasPwsh    = haveCmd('powershell', ['-NoProfile', '-Command', 'exit 0']);

// Run a loop script against a STATE.md fixture in an isolated temp cwd.
// Returns { status, out } where out is combined stdout+stderr.
function runScriptWithFixture(kind, stateBody) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-vl-'));
  try {
    fs.mkdirSync(path.join(dir, '.gsd'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.gsd', 'STATE.md'), stateBody, 'utf8');

    const res = kind === 'bat'
      ? spawnSync('cmd', ['/c', BAT_ABS], { cwd: dir, encoding: 'utf8', timeout: 30000 })
      : spawnSync('powershell', ['-NoProfile', '-File', PS1_ABS], { cwd: dir, encoding: 'utf8', timeout: 30000 });

    const out = `${res.stdout || ''}${res.stderr || ''}`;
    return { status: res.status, out };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const behavioral = [
  { id: 'A-15', kind: 'bat', desc: 'run-unattended.bat: terminal fixture exits 0 with SUCCESS',
    fixture: FIXTURE_TERMINAL,        wantStatus: 0, wantText: 'SUCCESS' },
  { id: 'A-16', kind: 'bat', desc: 'run-unattended.bat: inline-blocker fixture exits 1 with STOPPED',
    fixture: FIXTURE_BLOCKER_INLINE,  wantStatus: 1, wantText: 'STOPPED' },
  { id: 'A-17', kind: 'bat', desc: 'run-unattended.bat: list-blocker fixture exits 1 (F-4 regression)',
    fixture: FIXTURE_BLOCKER_LIST,    wantStatus: 1, wantText: 'STOPPED' },
  { id: 'A-18', kind: 'ps1', desc: 'run-unattended.ps1: terminal fixture exits 0 with SUCCESS',
    fixture: FIXTURE_TERMINAL,        wantStatus: 0, wantText: 'SUCCESS' },
  { id: 'A-19', kind: 'ps1', desc: 'run-unattended.ps1: inline-blocker fixture exits 1 with STOPPED',
    fixture: FIXTURE_BLOCKER_INLINE,  wantStatus: 1, wantText: 'STOPPED' },
  { id: 'A-20', kind: 'ps1', desc: 'run-unattended.ps1: list-blocker fixture exits 1 (F-4 regression)',
    fixture: FIXTURE_BLOCKER_LIST,    wantStatus: 1, wantText: 'STOPPED' },
];

for (const t of behavioral) {
  // Skip platform-specific tests when the required runtime is unavailable.
  if (t.kind === 'bat' && !hasCmdExe) {
    skip(t.id, t.desc, 'cmd.exe not available (non-Windows)');
    continue;
  }
  if (t.kind === 'ps1' && !hasPwsh) {
    skip(t.id, t.desc, 'powershell not available');
    continue;
  }

  let status = null;
  let out = '';
  try {
    ({ status, out } = runScriptWithFixture(t.kind, t.fixture));
  } catch (e) {
    out = `exception: ${e.message}`;
  }
  const ok = status === t.wantStatus && out.includes(t.wantText);
  assert(
    t.id,
    t.desc,
    ok,
    `expected exit ${t.wantStatus} and output containing "${t.wantText}", got exit ${status}; output: ${out.replace(/\s+/g, ' ').trim().slice(0, 200)}`
  );
}

// ── F-7 fix: Shipper commits AGENTS.md / clean-tree covers untracked (A-21, A-22) ─
// gsd-init creates AGENTS.md but no mode committed it, so it stayed untracked through a
// whole milestone (defect F-7). The fix: rule 06 stages AGENTS.md alongside .gsd/ state,
// and rule 01's clean-tree check explicitly counts untracked files. These assertions guard
// the rule text so the fix cannot silently regress.

const shipperRule06 = readRepoFile('.bob/rules-gsd-shipper/06-commit-workflow-state.md') || '';
const shipperRule01 = readRepoFile('.bob/rules-gsd-shipper/01-pre-ship-checklist.md') || '';

assert(
  'A-21',
  'rules-gsd-shipper/06 stages AGENTS.md alongside .gsd/ state (F-7)',
  shipperRule06.includes('AGENTS.md'),
  'rule 06 does not mention AGENTS.md — the F-7 commit-ownership fix is missing'
);

assert(
  'A-22',
  'rules-gsd-shipper/01 clean-tree check counts untracked files (F-7)',
  /untracked/i.test(shipperRule01),
  'rule 01 pre-ship checklist does not mention untracked files — the F-7 gate tightening is missing'
);

// ── Phase 10: gsd-bob bundle assertions (A-23…A-31) ───────────────────────────
// These validate the gsd-bob/ auto-setup bundle. They run ONLY in the source repo (where
// gsd-bob/ exists); a deployed target repo has no gsd-bob/, so the whole block is skipped
// and the deployed copy of this validator stays at its base assertions.

const BUNDLE  = path.resolve(GSD_REPO_ROOT, 'gsd-bob');
const PAYLOAD = path.join(BUNDLE, 'payload');
const ROOT    = GSD_REPO_ROOT;

function readAbs(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } }
function norm(s) { return s == null ? null : s.replace(/\r\n/g, '\n'); }

if (fs.existsSync(BUNDLE)) {
  const bashOk = haveCmd('bash', ['-c', 'echo ok']);
  const gitOk  = haveCmd('git', ['--version']);
  const psOk   = haveCmd('powershell', ['-NoProfile', '-Command', 'exit 0']);

  // A-23  payload custom_modes.yaml lists all six GSD slugs
  const cm = readAbs(path.join(PAYLOAD, '.bob', 'custom_modes.yaml')) || '';
  const cmMissing = GSD_MODES.filter((m) => !new RegExp('slug:\\s*' + m + '(?:\\s|$)', 'm').test(cm));
  assert('A-23', 'gsd-bob payload custom_modes.yaml lists all six GSD slugs',
    cm !== '' && cmMissing.length === 0,
    cm === '' ? 'payload/.bob/custom_modes.yaml missing' : `missing slugs: ${cmMissing.join(', ')}`);

  // A-24  payload has all six rules-gsd-* directories
  const missingRuleDirs = GSD_MODES.filter((m) => !fs.existsSync(path.join(PAYLOAD, '.bob', 'rules-' + m)));
  assert('A-24', 'gsd-bob payload has all six rules-gsd-* directories',
    missingRuleDirs.length === 0, `missing: ${missingRuleDirs.map((m) => 'rules-' + m).join(', ')}`);

  // A-25  payload has the three unattended-loop scripts (ps1, bat, sh)
  const loopScripts = ['run-unattended.ps1', 'run-unattended.bat', 'run-unattended.sh'];
  const missingLoops = loopScripts.filter((f) => !fs.existsSync(path.join(PAYLOAD, 'scripts', f)));
  assert('A-25', 'gsd-bob payload has run-unattended.{ps1,bat,sh}',
    missingLoops.length === 0, `missing: ${missingLoops.join(', ')}`);

  // A-26  payload .gsd has schema, modes, seed STATE, and the five blank templates
  const gsdNeeded = ['STATE.schema.md', 'STATE.md', 'PROJECT.md', 'REQUIREMENTS.md', 'ROADMAP.md', 'CONTEXT.md', 'VERIFY.md'];
  const missingGsd = gsdNeeded.filter((f) => !fs.existsSync(path.join(PAYLOAD, '.gsd', f)));
  const hasModes = fs.existsSync(path.join(PAYLOAD, '.gsd', 'modes'));
  assert('A-26', 'gsd-bob payload .gsd has schema + seed + templates + modes/',
    missingGsd.length === 0 && hasModes,
    `missing: ${missingGsd.join(', ')}${hasModes ? '' : ' modes/'}`);

  // A-27  payload seed STATE.md conforms to the canonical schema (plain keys, phase 1/discussing)
  const seed = readAbs(path.join(PAYLOAD, '.gsd', 'STATE.md')) || '';
  const seedOk =
    /^# STATE$/m.test(seed) &&
    /^milestone: /m.test(seed) &&
    /^current_phase: 1$/m.test(seed) &&
    /^phase_status: discussing$/m.test(seed) &&
    /^last_completed_task: none$/m.test(seed) &&
    /^open_decisions:$/m.test(seed) &&
    /^blockers: none$/m.test(seed) &&
    !seed.includes('**');                       // no markdown-bold keys (F-1)
  assert('A-27', 'gsd-bob payload seed STATE.md conforms to STATE.schema.md',
    seedOk, `seed STATE.md does not match canonical schema:\n${seed.slice(0, 200)}`);

  // A-28  payload does not drift from canonical sources (representative file set)
  // Paths use gsd-setup/ for user-facing assets; repo root for .bob/ assets.
  const driftPairs = [
    { src: path.join(GSD_REPO_ROOT, '.bob', 'custom_modes.yaml'),             payload: '.bob/custom_modes.yaml' },
    { src: path.join(GSD_SETUP_DIR, 'scripts', 'run-unattended.sh'),          payload: 'scripts/run-unattended.sh' },
    { src: path.join(GSD_SETUP_DIR, 'scripts', 'run-unattended.ps1'),         payload: 'scripts/run-unattended.ps1' },
    { src: path.join(GSD_SETUP_DIR, 'scripts', 'run-unattended.bat'),         payload: 'scripts/run-unattended.bat' },
    { src: path.join(GSD_SETUP_DIR, 'test', 'validate-loop.js'),              payload: 'test/validate-loop.js' },
    { src: path.join(GSD_SETUP_DIR, 'test', 'simulate-gates.js'),             payload: 'test/simulate-gates.js' },
    { src: path.join(GSD_SETUP_DIR, 'docs', 'DEPLOY.md'),                     payload: 'docs/DEPLOY.md' },
  ];
  const drifted = driftPairs
    .filter(({ src, payload }) => norm(readAbs(src)) !== norm(readAbs(path.join(PAYLOAD, payload))))
    .map(({ payload }) => payload);
  assert('A-28', 'gsd-bob payload mirrors canonical sources (no drift) — run build-payload to refresh',
    drifted.length === 0, `drifted (rebuild payload): ${drifted.join(', ')}`);

  // A-29  bash installer/loop scripts pass `bash -n`
  if (bashOk) {
    const shScripts = [
      path.join(BUNDLE, 'setup.sh'),
      path.join(BUNDLE, 'bootstrap.sh'),
      path.join(BUNDLE, 'build-payload.sh'),
      path.join(PAYLOAD, 'scripts', 'run-unattended.sh'),
    ];
    const badSh = shScripts.filter((p) => {
      try { return spawnSync('bash', ['-n', p], { encoding: 'utf8', timeout: 15000 }).status !== 0; }
      catch (e) { return true; }
    });
    assert('A-29', 'gsd-bob bash scripts pass `bash -n`', badSh.length === 0,
      `parse errors in: ${badSh.map((p) => path.basename(p)).join(', ')}`);
  } else {
    skip('A-29', 'gsd-bob bash scripts pass `bash -n`', 'bash not available');
  }

  // A-30  PowerShell installer scripts tokenize without error
  if (psOk) {
    const psScripts = [
      path.join(BUNDLE, 'setup.ps1'),
      path.join(BUNDLE, 'bootstrap.ps1'),
      path.join(BUNDLE, 'build-payload.ps1'),
    ];
    const tokCheck =
      '$ErrorActionPreference="Stop";$bad=@();' +
      'foreach($f in $args){$e=$null;$t=$null;' +
      '[System.Management.Automation.Language.Parser]::ParseFile($f,[ref]$t,[ref]$e)|Out-Null;' +
      'if($e -and $e.Count){$bad+=$f}};' +
      'if($bad.Count){Write-Output ("BAD:"+($bad -join ","));exit 1}else{exit 0}';
    let r;
    try { r = spawnSync('powershell', ['-NoProfile', '-Command', tokCheck, ...psScripts], { encoding: 'utf8', timeout: 30000 }); }
    catch (e) { r = { status: 1, stdout: e.message }; }
    assert('A-30', 'gsd-bob PowerShell scripts parse without error',
      r.status === 0, `parse errors: ${(r.stdout || '').trim()}`);
  } else {
    skip('A-30', 'gsd-bob PowerShell scripts parse without error', 'powershell not available');
  }

  // Helper: assert a freshly-installed target repo got the core artifacts + a valid seed.
  function assertInstalled(id, desc, dir, detailPrefix) {
    const okModes = (readAbs(path.join(dir, '.bob', 'custom_modes.yaml')) || '').match(/slug:/g);
    const okRules = GSD_MODES.every((m) => fs.existsSync(path.join(dir, '.bob', 'rules-' + m)));
    const st = readAbs(path.join(dir, '.gsd', 'STATE.md')) || '';
    const okState = /^phase_status: discussing$/m.test(st) && /^current_phase: 1$/m.test(st);
    const okIgnore = /(^|\n)\.bob\/notes\/\s*(\n|$)/.test(readAbs(path.join(dir, '.gitignore')) || '');
    // AGENTS.md must NOT be pre-seeded by the installer — gsd-init authors it for the target.
    const noAgents = !fs.existsSync(path.join(dir, 'AGENTS.md'));
    const ok = okModes && okModes.length === 6 && okRules && okState && okIgnore && noAgents;
    assert(id, desc, ok,
      `${detailPrefix}: modes=${okModes ? okModes.length : 0} rules=${okRules} state=${okState} gitignore=${okIgnore} noAgents=${noAgents}`);
  }

  // A-31  dry-run LOCAL install lands every expected path with a schema-valid .gsd/
  if (bashOk && gitOk) {
    let dir = null;
    try {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-inst-'));
      spawnSync('git', ['init', '-q'], { cwd: dir, encoding: 'utf8' });
      spawnSync('bash', [path.join(BUNDLE, 'setup.sh'), '--target', dir],
        { cwd: dir, encoding: 'utf8', timeout: 120000, env: { ...process.env } });
      assertInstalled('A-31', 'gsd-bob setup.sh local install lands artifacts + valid seed', dir, 'local install');
    } catch (e) {
      assert('A-31', 'gsd-bob setup.sh local install lands artifacts + valid seed', false, `exception: ${e.message}`);
    } finally {
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
    }
  } else {
    skip('A-31', 'gsd-bob setup.sh local install lands artifacts + valid seed', 'bash/git not available');
  }

  // A-32  dry-run REMOTE install (against a local file:// fixture remote) lands artifacts
  if (bashOk && gitOk) {
    let remote = null, dir = null;
    try {
      remote = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-remote-'));
      fs.cpSync(BUNDLE, remote, { recursive: true });
      const gEnv = { cwd: remote, encoding: 'utf8' };
      spawnSync('git', ['init', '-q'], gEnv);
      spawnSync('git', ['config', 'user.email', 't@t.co'], gEnv);
      spawnSync('git', ['config', 'user.name', 't'], gEnv);
      spawnSync('git', ['add', '-A'], gEnv);
      spawnSync('git', ['commit', '-qm', 'bundle'], gEnv);
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-rinst-'));
      spawnSync('git', ['init', '-q'], { cwd: dir, encoding: 'utf8' });
      const url = 'file://' + remote.replace(/\\/g, '/');
      spawnSync('bash', [path.join(BUNDLE, 'setup.sh'), '--target', dir, '--from-remote', url],
        { cwd: dir, encoding: 'utf8', timeout: 120000, env: { ...process.env } });
      assertInstalled('A-32', 'gsd-bob setup.sh --from-remote install lands artifacts (file:// fixture)', dir, 'remote install');
    } catch (e) {
      assert('A-32', 'gsd-bob setup.sh --from-remote install lands artifacts (file:// fixture)', false, `exception: ${e.message}`);
    } finally {
      if (remote) fs.rmSync(remote, { recursive: true, force: true });
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
    }
  } else {
    skip('A-32', 'gsd-bob setup.sh --from-remote install lands artifacts (file:// fixture)', 'bash/git not available');
  }

  // A-33  --global-modes merge: backs up, dedupes existing slug, preserves non-GSD, adds rest
  if (bashOk && gitOk) {
    let home = null, dir = null;
    try {
      home = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-home-'));
      fs.mkdirSync(path.join(home, '.bob'), { recursive: true });
      fs.writeFileSync(path.join(home, '.bob', 'custom_modes.yaml'),
        'customModes:\n  - slug: my-custom-mode\n    name: Mine\n    roleDefinition: x\n  - slug: gsd-init\n    name: Old\n    roleDefinition: y\n');
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-gm-'));
      spawnSync('git', ['init', '-q'], { cwd: dir, encoding: 'utf8' });
      spawnSync('bash', [path.join(BUNDLE, 'setup.sh'), '--target', dir, '--global-modes'],
        { cwd: dir, encoding: 'utf8', timeout: 120000, env: { ...process.env, HOME: home } });
      const merged = readAbs(path.join(home, '.bob', 'custom_modes.yaml')) || '';
      const initCount = (merged.match(/slug:\s*gsd-init(?:\s|$)/gm) || []).length;
      const allSix = GSD_MODES.every((m) => new RegExp('slug:\\s*' + m + '(?:\\s|$)', 'm').test(merged));
      const preserved = /slug:\s*my-custom-mode/.test(merged);
      const backedUp = fs.readdirSync(path.join(home, '.bob')).some((f) => f.includes('.bak-'));
      assert('A-33', 'gsd-bob --global-modes merges by slug (backup, no dup, preserve non-GSD)',
        initCount === 1 && allSix && preserved && backedUp,
        `initCount=${initCount} allSix=${allSix} preserved=${preserved} backedUp=${backedUp}`);
    } catch (e) {
      assert('A-33', 'gsd-bob --global-modes merges by slug (backup, no dup, preserve non-GSD)', false, `exception: ${e.message}`);
    } finally {
      if (home) fs.rmSync(home, { recursive: true, force: true });
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
    }
  } else {
    skip('A-33', 'gsd-bob --global-modes merges by slug (backup, no dup, preserve non-GSD)', 'bash/git not available');
  }
}

// ── report ────────────────────────────────────────────────────────────────────

const COL_ID   = 6;
const COL_DESC = 65;
const COL_RES  = 6;

const sep = '-'.repeat(COL_ID + COL_DESC + COL_RES + 4);

console.log('\n' + sep);
console.log('GSD Unattended-Loop Validation');
console.log(sep);

const header = `${'ID'.padEnd(COL_ID)}  ${'Description'.padEnd(COL_DESC)}  ${'Result'}`;
console.log(header);
console.log(sep);

for (const r of results) {
  const icon = r.result === 'PASS' ? '✅' : r.result === 'SKIP' ? '⏭️' : '❌';
  const line = `${r.id.padEnd(COL_ID)}  ${r.description.padEnd(COL_DESC)}  ${icon} ${r.result}`;
  console.log(line);
  if (r.result === 'SKIP' && r.detail) {
    console.log(`${''.padEnd(COL_ID)}  SKIPPED: ${r.detail}`);
  }
  if (r.result === 'FAIL' && r.detail) {
    console.log(`${''.padEnd(COL_ID)}  DETAIL: ${r.detail}`);
  }
}

console.log(sep);
console.log(`Total: ${passed + failed + skipped}   Passed: ${passed}   Failed: ${failed}   Skipped: ${skipped}`);
console.log(sep + '\n');

process.exit(failed > 0 ? 1 : 0);
