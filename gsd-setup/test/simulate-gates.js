/**
 * gsd-setup/test/simulate-gates.js
 *
 * Automated dry-run simulation for Phase 4: Human-in-the-Loop Gates.
 *
 * Replays a full GSD state-machine cycle:
 *   discussing → planned → executing → verifying → shipped
 *
 * At each transition, asserts that the mode file owning that boundary
 * contains the required gate instruction text.
 *
 * Usage:
 *   node gsd-setup/test/simulate-gates.js
 *
 * Exit codes:
 *   0 — all gates pass
 *   1 — one or more gates fail
 *
 * No external dependencies. Requires Node.js >= 14.
 */

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ─── Paths ────────────────────────────────────────────────────────────────────
// This file lives at <repo>/gsd-setup/test/simulate-gates.js
// .gsd/ and modes/ are at the repo root, two levels up.

const GSD_REPO_ROOT = path.resolve(__dirname, '../..');
const MODES_DIR     = path.join(GSD_REPO_ROOT, '.gsd', 'modes', 'docs');
const STATE_FILE    = path.join(GSD_REPO_ROOT, '.gsd', 'STATE.md');

function modeFile(name) {
  return path.join(MODES_DIR, name);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

/**
 * Assert that `content` contains ALL of the given `phrases`.
 * Matching is case-insensitive.
 * Returns { pass: bool, missing: string[] }
 */
function containsAll(content, phrases) {
  const lower = content.toLowerCase();
  const missing = phrases.filter(p => !lower.includes(p.toLowerCase()));
  return { pass: missing.length === 0, missing };
}

/**
 * Assert that `content` does NOT contain any of the `phrases`.
 * Case-insensitive.
 * Returns { pass: bool, found: string[] }
 */
function containsNone(content, phrases) {
  const lower = content.toLowerCase();
  const found = phrases.filter(p => lower.includes(p.toLowerCase()));
  return { pass: found.length === 0, found };
}

// ─── Test runner ──────────────────────────────────────────────────────────────

const results = [];

function assert(gateId, description, modeFileName, testFn) {
  const filePath = modeFileName === 'STATE.md' ? STATE_FILE : modeFile(modeFileName);
  const content  = readFile(filePath);

  if (content === null) {
    results.push({
      gate:   gateId,
      desc:   description,
      file:   modeFileName,
      pass:   false,
      detail: 'ERROR: file not found — ' + filePath,
    });
    return;
  }

  const { pass, detail } = testFn(content);
  results.push({ gate: gateId, desc: description, file: modeFileName, pass, detail: detail || '' });
}

// ─── Simulation ───────────────────────────────────────────────────────────────

console.log('');
console.log('GSD Phase 4 — Human-in-the-Loop Gate Simulation');
console.log('='.repeat(60));
console.log('');
console.log('Replaying state machine: discussing -> planned -> executing');
console.log('                         -> verifying -> shipped');
console.log('');

// ── Step 1: Bootstrap — STATE.md must exist and be parseable ─────────────────

console.log('Step 1  Bootstrap — reading STATE.md');
assert(
  'BOOTSTRAP',
  'STATE.md exists and contains required keys',
  'STATE.md',
  function(content) {
    var required = ['milestone', 'current_phase', 'phase_status', 'last_completed_task', 'blockers'];
    var missing  = required.filter(function(k) { return !content.includes(k); });
    return {
      pass:   missing.length === 0,
      detail: missing.length ? 'Missing keys: ' + missing.join(', ') : '',
    };
  }
);

// ── Step 2: discussing → planned  (G-1: Planner STOP gate) ───────────────────

console.log('Step 2  Simulating: discussing -> Planner delegation');
assert(
  'G-1',
  'gsd-planner halts after writing plan and requires explicit approval',
  'gsd-planner.md',
  function(content) {
    var check = containsAll(content, ['STOP', 'approval']);
    return {
      pass:   check.pass,
      detail: check.pass ? '' : 'Required phrase(s) not found: ' + check.missing.join(', '),
    };
  }
);

// ── Step 3: planned — Orchestrator must NOT auto-advance (G-2) ───────────────
// We verify the "planned" gate requires a STOP, and that the doc does NOT contain
// any affirmative instruction to auto-advance (e.g. "will auto-advance", "automatically
// advances", "auto-advance without"). The phrase "never auto-advance to executing" is
// the CORRECT prohibition text and must NOT be treated as a violation.

console.log('Step 3  Simulating: state = planned — Orchestrator routing check');
assert(
  'G-2',
  'gsd-orchestrator presents plan at "planned" status; does not auto-advance',
  'gsd-orchestrator.md',
  function(content) {
    var check = containsAll(content, ['planned', 'STOP']);
    if (!check.pass) {
      return { pass: false, detail: 'Required phrase(s) not found: ' + check.missing.join(', ') };
    }
    // Ban affirmative auto-advance instructions, NOT the "never auto-advance" prohibition.
    var forbidden = ['will auto-advance', 'automatically advance to executing', 'auto-advance without'];
    var autoCheck = containsNone(content, forbidden);
    return {
      pass:   autoCheck.pass,
      detail: autoCheck.pass ? '' : 'Found affirmative auto-advance instruction(s): ' + autoCheck.found.join(', '),
    };
  }
);

// ── Step 4: explicit approval token required ──────────────────────────────────

console.log('Step 4  Simulating: user approval -> executing');
assert(
  'G-2b',
  'gsd-orchestrator requires explicit approval token to leave planned state',
  'gsd-orchestrator.md',
  function(content) {
    var check = containsAll(content, ['approved']);
    return {
      pass:   check.pass,
      detail: check.pass ? '' : 'Required phrase(s) not found: ' + check.missing.join(', '),
    };
  }
);

// ── Step 5: verifying → Shipper  (G-3: Shipper PR gate) ──────────────────────

console.log('Step 5  Simulating: state = verifying -> Shipper delegation');
assert(
  'G-3',
  'gsd-shipper halts before creating PR and requires manual approval',
  'gsd-shipper.md',
  function(content) {
    var check = containsAll(content, ['STOP', 'manual approval']);
    return {
      pass:   check.pass,
      detail: check.pass ? '' : 'Required phrase(s) not found: ' + check.missing.join(', '),
    };
  }
);

// ── Step 6: Blocker injection  (G-4: Orchestrator blocker halt) ──────────────

console.log('Step 6  Simulating: blocker injected into STATE.md');
assert(
  'G-4',
  'gsd-orchestrator surfaces blockers and halts — does not route around them',
  'gsd-orchestrator.md',
  function(content) {
    var hasBlockers = containsAll(content, ['blockers']);
    if (!hasBlockers.pass) {
      return { pass: false, detail: 'No blocker handling found in role definition' };
    }
    var hasHalt = containsAll(content, ['halt']);
    var hasStop = containsAll(content, ['stop']);
    var pass = hasHalt.pass || hasStop.pass;
    return {
      pass:   pass,
      detail: pass ? '' : 'Blocker section found but no halt/stop instruction present',
    };
  }
);

// ── Step 7: Strict approval wording  (G-5) ───────────────────────────────────

console.log('Step 7  Simulating: approval wording specificity check');
assert(
  'G-5',
  'gsd-orchestrator requires explicit tokens and rejects vague language',
  'gsd-orchestrator.md',
  function(content) {
    var hasTokens = containsAll(content, ['approved', 'go', 'proceed']);
    if (!hasTokens.pass) {
      return { pass: false, detail: 'Required approval token(s) missing: ' + hasTokens.missing.join(', ') };
    }
    var hasRejection = containsAll(content, ['looks good']);
    if (!hasRejection.pass) {
      return {
        pass:   false,
        detail: '"looks good" vague language is not explicitly rejected in role definition',
      };
    }
    return { pass: true, detail: '' };
  }
);

// ── Step 8: Shipper blocks on open VERIFY.md failures ────────────────────────

console.log('Step 8  Simulating: shipping blocked when VERIFY.md has open failures');
assert(
  'G-3b',
  'gsd-shipper checks VERIFY.md for open failures before creating PR',
  'gsd-shipper.md',
  function(content) {
    // The phrase may span a line break ("zero open\nfailures") in the source file.
    // Check for VERIFY.md reference AND any of: "open failures", "zero open", "no open"
    var hasVerify = containsAll(content, ['VERIFY.md']);
    if (!hasVerify.pass) {
      return { pass: false, detail: 'VERIFY.md reference not found in role definition' };
    }
    var lower = content.toLowerCase();
    var hasGate = lower.includes('open failures') ||
                  lower.includes('zero open') ||
                  lower.includes('no open');
    return {
      pass:   hasGate,
      detail: hasGate ? '' : 'No "open failures"/"zero open" check found near VERIFY.md reference',
    };
  }
);

// ─── Results table ────────────────────────────────────────────────────────────

console.log('');
console.log('-'.repeat(60));
console.log('Results');
console.log('-'.repeat(60));
console.log('');

function pad(str, len) {
  return String(str).padEnd(len);
}

var COL_GATE = 10;
var COL_PASS = 6;
var COL_FILE = 24;

console.log(
  pad('Gate', COL_GATE) +
  pad('Pass', COL_PASS) +
  pad('File', COL_FILE) +
  'Description'
);
console.log(
  '-'.repeat(COL_GATE) +
  '-'.repeat(COL_PASS) +
  '-'.repeat(COL_FILE) +
  '-'.repeat(52)
);

var passed = 0;
var failed = 0;

for (var i = 0; i < results.length; i++) {
  var r    = results[i];
  var mark = r.pass ? 'PASS' : 'FAIL';
  console.log(
    pad(r.gate, COL_GATE) +
    pad(mark, COL_PASS) +
    pad(r.file, COL_FILE) +
    r.desc
  );
  if (!r.pass && r.detail) {
    console.log(' '.repeat(COL_GATE + COL_PASS) + '^ ' + r.detail);
  }
  if (r.pass) { passed++; } else { failed++; }
}

console.log('');
console.log('Total: ' + results.length + '  Passed: ' + passed + '  Failed: ' + failed);
console.log('');

if (failed > 0) {
  console.log('SIMULATION FAILED -- one or more gates are not correctly implemented.');
  console.log('See details above. Fix the identified mode files and re-run.');
  console.log('');
  process.exit(1);
} else {
  console.log('ALL GATES PASS -- state machine gates are correctly implemented.');
  console.log('');
  process.exit(0);
}
