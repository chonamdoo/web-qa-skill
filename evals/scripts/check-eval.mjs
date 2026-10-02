import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadAssets } from './assets.mjs';
import { assess } from './eval-policy.mjs';

async function main() {
  const args = process.argv.slice(2);
  const command = args.shift() || 'check';
  const options = {};
  while (args.length) {
    const flag = args.shift();
    if (!['--repo', '--report', '--evidence-root'].includes(flag) || !args.length || options[flag]) throw new Error('invalid CLI arguments');
    options[flag] = args.shift();
  }
  const root = resolve(options['--repo'] || fileURLToPath(new URL('../../', import.meta.url)));
  const { bundle, cases, criteria } = await loadAssets(root);
  if (command === 'fingerprint') return { exit: 0, output: bundle };
  if (command === 'validate') return { exit: 0, output: { static: 'PASS', behavior: 'NOT_RUN', bundleSha256: bundle.bundleSha256 } };
  if (command !== 'check') throw new Error('unknown command');
  const reportPath = resolve(options['--report'] || join(root, 'evals/results/current.json'));
  let report;
  try { report = JSON.parse(await readFile(reportPath, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return { exit: 1, output: { gate: 'BLOCKED', problems: ['current behavioral report missing'], bundleSha256: bundle.bundleSha256 } }; throw new Error('report unreadable or invalid JSON'); }
  const verdict = assess(report, bundle, cases, criteria);
  const temp = await mkdtemp(join(tmpdir(), 'web-qa-eval-gate-'));
  let integrity;
  try {
    const plan = { version: 1, runId: report.runId, buildId: bundle.bundleSha256, required: verdict.required };
    const result = { version: 1, runId: report.runId, buildId: bundle.bundleSha256, runnerExitCode: 0, attempts: verdict.attempts };
    await writeFile(join(temp, 'plan.json'), JSON.stringify(plan));
    await writeFile(join(temp, 'result.json'), JSON.stringify(result));
    const child = spawnSync(process.execPath, [join(root, 'skills/web-qa/scripts/check-run.mjs'), join(temp, 'plan.json'), join(temp, 'result.json'), resolve(options['--evidence-root'] || join(root, 'evals/results/evidence'))], { encoding: 'utf8' });
    if (child.error || child.signal || !child.stdout) throw new Error('evidence checker did not complete');
    integrity = JSON.parse(child.stdout);
    if (child.status === 2) throw new Error('invalid evidence/attempt contract');
  } finally { await rm(temp, { recursive: true, force: true }); }
  const integritySuffixes = [': missing evidence', ': evidence unavailable, outside root, empty, or digest mismatch', ': missing attempt history'];
  const evidenceProblems = integrity.problems.filter(x => integritySuffixes.some(suffix => x.endsWith(suffix)));
  const problems = [...verdict.problems, ...evidenceProblems];
  const gate = problems.length ? 'FAIL' : verdict.blocked.length ? 'BLOCKED' : integrity.gate === 'PASS' ? 'PASS' : 'FAIL';
  return { exit: gate === 'PASS' ? 0 : 1, output: { gate, runId: report.runId, bundleSha256: bundle.bundleSha256, problems, blocked: verdict.blocked, integrity, trust: 'Validates supplied independently judged records and hashes; not their truth or automatic skill selection.' } };
}
try { const { exit, output } = await main(); console.log(JSON.stringify(output)); process.exitCode = exit; }
catch { console.log(JSON.stringify({ gate: 'ERROR', problems: ['Invalid eval assets, report, arguments or evidence contract; no behavioral PASS.'] })); process.exitCode = 2; }
