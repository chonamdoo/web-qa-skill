import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { join } from 'node:path';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
const cli = resolve('evals/scripts/check-eval.mjs');
function run(args) {
  const child = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  assert.equal(child.error, undefined);
  return { exit: child.status, stdout: child.stdout, stderr: child.stderr };
}
test('validates-fixed-eval-assets-and-desktop-only-matrix', () => {
  const result = run(['validate']);
  assert.equal(result.exit, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).static, 'PASS');
  assert.equal(JSON.parse(result.stdout).behavior, 'NOT_RUN');
});
test('requires-current-bundle-and-all-mandatory-behavior-records', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'eval-missing-report-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const result = run(['check', '--report', join(dir, 'missing.json')]);
  assert.equal(result.exit, 1);
  assert.equal(JSON.parse(result.stdout).gate, 'BLOCKED');
});

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'eval-contract-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const evidenceRoot = join(dir, 'evidence');
  await mkdir(evidenceRoot);
  const ref = async (path, value) => {
    await writeFile(join(evidenceRoot, path), value);
    return { path, sha256: createHash('sha256').update(value).digest('hex') };
  };
  const scenario = await ref('scenarios.json', 'synthetic gate-contract scenario evidence, not an actual skill run');
  const suite = await ref('suite.txt', 'identical synthetic assertions for gate contract only');
  const outcome = await ref('outcome.txt', 'synthetic gate-contract outcomes, not real browser execution');
  const mapping = await ref('mapping.json', 'synthetic mapping trace retained for independent judgement, not execution proof');
  const fingerprint = JSON.parse(run(['fingerprint']).stdout);
  const criteria = JSON.parse(await readFile('evals/criteria.json', 'utf8'));
  const targets = ['chrome-1024', 'chrome-1280', 'safari-1024', 'safari-1280'];
  const ids = ['quantity-zero', 'quantity-blank', 'range-reversed', 'horizontal-overflow'];
  const report = {
    version: 1, runId: 'synthetic-contract-only', bundleSha256: fingerprint.bundleSha256,
    executor: { host: 'test', model: 'synthetic', mode: 'skill-behavior', freshContext: true, sourceLeakDetected: false, skillSha256: fingerprint.skillSha256, scenarioEvidence: scenario },
    judgments: criteria.required.map(x => ({ id: x.id, attempt: 1, status: 'PASS', reason: 'Synthetic record tests gate contract, not truth.', evidence: [outcome] })),
    planning: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map(id => ({ id, attempt: 1, status: 'PASS', reason: 'Synthetic record only.', evidence: [outcome] })),
    browsers: targets.map(id => ({ targetId: id, browser: id.split('-')[0], width: Number(id.split('-')[1]), version: 'synthetic', actual: true })),
    controls: targets.flatMap(targetId => ['faulty', 'corrected'].map(fixtureId => ({ fixtureId, targetId, attempt: 1, status: fixtureId === 'faulty' ? 'FAIL' : 'PASS', runnerExitCode: fixtureId === 'faulty' ? 1 : 0, suiteEvidence: suite, outcomeEvidence: outcome, mappingEvidence: mapping,
      assertions: ids.map(id => ({ id, sourceAssertionId: 'original-' + id, status: fixtureId === 'faulty' && (id !== 'horizontal-overflow' || targetId.endsWith('1024')) ? 'FAIL' : 'PASS', oracle: 'EXPLICIT', errorKind: 'ASSERTION_MISMATCH' })) }))),
    measurements: { rawTextBytes: 100, summaryBytes: 50, imageBytes: 0, modelTokens: null },
  };
  async function check() {
    await writeFile(join(dir, 'report.json'), JSON.stringify(report));
    const child = run(['check', '--report', join(dir, 'report.json'), '--evidence-root', evidenceRoot]);
    return { exit: child.exit, report: JSON.parse(child.stdout) };
  }
  return { report, check, evidenceRoot, ref };
}

test('current synthetic records pass the contract, while stale and incomplete records do not', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.check()).report.gate, 'PASS');
  f.report.bundleSha256 = '0'.repeat(64);
  assert.equal((await f.check()).report.gate, 'FAIL');
  f.report.bundleSha256 = JSON.parse(run(['fingerprint']).stdout).bundleSha256;
  f.report.judgments.pop();
  assert.equal((await f.check()).report.gate, 'BLOCKED');
});

test('rejects-contaminated-or-page-only-evaluation', async (t) => {
  const f = await fixture(t);
  f.report.executor.sourceLeakDetected = true;
  assert.equal((await f.check()).report.gate, 'FAIL');
  f.report.executor.sourceLeakDetected = false;
  f.report.executor.mode = 'page-regression';
  assert.equal((await f.check()).report.gate, 'FAIL');
  f.report.executor.mode = 'skill-behavior';
  f.report.executor.freshContext = false;
  assert.equal((await f.check()).report.gate, 'FAIL');
});

test('blocks-unavailable-required-targets-and-rejects-missing-evidence', async (t) => {
  const f = await fixture(t);
  f.report.controls[0].status = 'BLOCKED';
  f.report.controls[0].runnerExitCode = null;
  f.report.controls[0].assertions = [];
  assert.equal((await f.check()).report.gate, 'BLOCKED');
  f.report.browsers.pop();
  assert.equal((await f.check()).report.gate, 'BLOCKED');
  f.report.executor.scenarioEvidence.path = 'missing.json';
  assert.notEqual((await f.check()).exit, 0);
  f.report.executor.scenarioEvidence.path = '../outside.txt';
  assert.notEqual((await f.check()).exit, 0);
});

test('rejects-lost-attempts-and-mismatched-control-suites', async (t) => {
  const f = await fixture(t);
  f.report.controls[0].attempt = 2;
  assert.notEqual((await f.check()).exit, 0);
  f.report.controls[0].attempt = 1;
  f.report.controls[1].suiteEvidence = await f.ref('changed-suite.txt', 'changed assertions');
  assert.equal((await f.check()).report.gate, 'FAIL');
});

test('operational failure is not defect detection and corrected retries cannot erase failure', async (t) => {
  const f = await fixture(t);
  f.report.controls[0].assertions[0].errorKind = 'OPERATIONAL';
  assert.equal((await f.check()).report.gate, 'FAIL');
  f.report.controls[0].assertions[0].errorKind = 'ASSERTION_MISMATCH';
  const original = f.report.controls[1];
  f.report.controls.push({ ...original, attempt: 2 });
  original.status = 'FAIL';
  original.runnerExitCode = 1;
  assert.equal((await f.check()).report.gate, 'FAIL');
});

test('fixture server exposes only opaque pages on localhost', { timeout: 5000 }, async (t) => {
  const child = spawn(process.execPath, [resolve('evals/scripts/serve.mjs')], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => { child.kill('SIGTERM'); });
  /** @type {any} */
  const address = await new Promise((accept, reject) => {
    child.once('error', reject);
    child.once('exit', () => reject(new Error('server exited before readiness')));
    child.stdout.once('data', chunk => accept(JSON.parse(chunk.toString())));
  });
  assert.equal(address.host, '127.0.0.1');
  for (const path of address.pages) {
    const response = await fetch('http://127.0.0.1:' + address.port + path);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Quantity \(1–3\)/);
  }
  for (const path of ['/criteria.json', '/evals/criteria.json', '/prompts/planning.json', '/']) {
    assert.equal((await fetch('http://127.0.0.1:' + address.port + path)).status, 404);
  }
});

test('requires judgement outcomes and preserves mapping provenance without rejecting extra diagnostics', async (t) => {
  const f = await fixture(t);
  const original = f.report.judgments[0].evidence;
  f.report.judgments[0].evidence = [];
  assert.notEqual((await f.check()).exit, 0);
  f.report.judgments[0].evidence = original;
  f.report.planning[0].evidence = [];
  assert.notEqual((await f.check()).exit, 0);
  f.report.planning[0].evidence = original;
  f.report.controls[0].assertions.push({ id: 'search', sourceAssertionId: 'original-search', status: 'PASS', oracle: 'EXPLICIT', errorKind: '' });
  assert.equal((await f.check()).report.gate, 'PASS');
  delete f.report.controls[0].mappingEvidence;
  assert.notEqual((await f.check()).exit, 0);
});

test('unverified evidence criterion stays BLOCKED rather than product FAIL', async (t) => {
  const f = await fixture(t);
  const item = f.report.judgments.find(x => x.id === 'evidence');
  item.status = 'BLOCKED';
  assert.equal((await f.check()).report.gate, 'BLOCKED');
  f.report.judgments = f.report.judgments.filter(x => x.id !== 'evidence');
  assert.equal((await f.check()).report.gate, 'BLOCKED');
});


test('additional control assertions must pass on both faulty and corrected fixtures', async (t) => {
  const f = await fixture(t);
  for (const fixtureId of ['faulty', 'corrected']) {
    const control = f.report.controls.find(x => x.fixtureId === fixtureId);
    const extra = { id: 'search', sourceAssertionId: 'original-search', status: 'PASS', oracle: 'EXPLICIT', errorKind: '' };
    control.assertions.push(extra);
    assert.equal((await f.check()).report.gate, 'PASS');
    for (const status of ['FAIL', 'BLOCKED', 'NOT_RUN', 'UNVERIFIED']) {
      extra.status = status;
      const result = await f.check();
      assert.equal(result.report.gate, 'FAIL', fixtureId + '/' + status);
      assert.equal(result.exit, 1);
    }
    extra.status = 'PASS';
    assert.equal((await f.check()).report.gate, 'PASS');
  }
});
