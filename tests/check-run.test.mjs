import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, rm, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../skills/web-qa/scripts/check-run.mjs', import.meta.url));
const hash = (value) => createHash('sha256').update(value).digest('hex');
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'web-qa-gate-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const root = join(dir, 'evidence');
  await mkdir(root);
  await writeFile(join(root, 'outcome.txt'), 'saved order confirmed by reread');
  const item = { scenarioId: 'save-order', targetId: 'chrome-desktop' };
  const plan = { version: 1, runId: 'run-current', buildId: 'build-current', required: [item] };
  const result = {
    version: 1, runId: plan.runId, buildId: plan.buildId, runnerExitCode: 0,
    attempts: [{ ...item, attempt: 1, status: 'PASS', evidence: [{ path: 'outcome.txt', sha256: hash('saved order confirmed by reread') }] }],
  };
  async function run() {
    await writeFile(join(dir, 'plan.json'), JSON.stringify(plan));
    await writeFile(join(dir, 'result.json'), JSON.stringify(result));
    const child = spawnSync(process.execPath, [cli, join(dir, 'plan.json'), join(dir, 'result.json'), root], { encoding: 'utf8' });
    assert.equal(child.error, undefined);
    assert.equal(child.stderr, '');
    return { exit: child.status, report: JSON.parse(child.stdout) };
  }
  return { dir, root, plan, result, run };
}

test('passes complete records and hash-matching evidence without conflating runner and gate status', async (t) => {
  const f = await fixture(t);
  const first = await f.run();
  assert.equal(first.exit, 0);
  assert.equal(first.report.gate, 'PASS');
  f.result.runnerExitCode = 1;
  const second = await f.run();
  assert.equal(second.exit, 1);
  assert.equal(second.report.runnerExitCode, 1);
});

test('rejects an empty plan and detects a missing required target', async (t) => {
  const f = await fixture(t);
  f.plan.required.push({ scenarioId: 'save-order', targetId: 'ios-safari' });
  assert.equal((await f.run()).exit, 1);
  f.plan.required = [];
  assert.equal((await f.run()).exit, 2);
});

test('preserves all original nonpassing statuses even when a retry passes', async (t) => {
  for (const status of ['FAIL', 'FLAKY', 'SKIPPED', 'BLOCKED', 'NOT_RUN', 'QUARANTINED']) {
    const f = await fixture(t);
    f.result.attempts.push({ ...f.result.attempts[0], attempt: 2 });
    f.result.attempts[0].status = status;
    assert.equal((await f.run()).exit, 1, status);
  }
});

test('rejects stale run/build identity and missing retry history', async (t) => {
  const f = await fixture(t);
  f.result.runId = 'run-old';
  assert.equal((await f.run()).exit, 1);
  f.result.runId = f.plan.runId;
  f.result.buildId = 'build-old';
  assert.equal((await f.run()).exit, 1);
  f.result.buildId = f.plan.buildId;
  f.result.attempts[0].attempt = 2;
  assert.equal((await f.run()).exit, 1);
});

test('rejects duplicate, unexpected, and malformed result records', async (t) => {
  const f = await fixture(t);
  f.result.attempts.push({ ...f.result.attempts[0] });
  assert.equal((await f.run()).exit, 2);
  f.result.attempts.pop();
  f.result.attempts[0].targetId = 'unplanned';
  assert.equal((await f.run()).exit, 2);
  f.result.attempts[0].targetId = f.plan.required[0].targetId;
  f.result.attempts[0].status = 'unknown';
  assert.equal((await f.run()).exit, 2);
  f.result.attempts[0].status = 'PASS';
  f.result.runnerExitCode = null;
  assert.equal((await f.run()).exit, 2);
});

test('fails for missing, changed, empty, or directory evidence', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.root, 'outcome.txt'), 'changed');
  assert.equal((await f.run()).exit, 1);
  await writeFile(join(f.root, 'outcome.txt'), '');
  f.result.attempts[0].evidence[0].sha256 = hash('');
  assert.equal((await f.run()).exit, 1);
  await rm(join(f.root, 'outcome.txt'));
  assert.equal((await f.run()).exit, 1);
  await mkdir(join(f.root, 'outcome.txt'));
  assert.equal((await f.run()).exit, 1);
  f.result.attempts[0].evidence = [];
  assert.equal((await f.run()).exit, 1);
});

test('rejects traversal and symlink escapes even with a matching digest', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.dir, 'outside.txt'), 'secret');
  const evidence = f.result.attempts[0].evidence[0];
  evidence.sha256 = hash('secret');
  evidence.path = '../outside.txt';
  assert.equal((await f.run()).exit, 1);
  await symlink(join(f.dir, 'outside.txt'), join(f.root, 'link.txt'));
  evidence.path = 'link.txt';
  assert.equal((await f.run()).exit, 1);
});

test('invalid JSON fails closed without echoing secret input', async (t) => {
  const f = await fixture(t);
  const path = join(f.dir, 'invalid.json');
  await writeFile(path, '{"secret":"do-not-echo", broken');
  const child = spawnSync(process.execPath, [cli, path, path, f.root], { encoding: 'utf8' });
  assert.equal(child.status, 2);
  assert.equal(child.stdout.includes('do-not-echo'), false);
  assert.equal(JSON.parse(child.stdout).gate, 'ERROR');
});
