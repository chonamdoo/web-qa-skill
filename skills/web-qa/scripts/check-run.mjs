#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const statuses = new Set(['PASS', 'FAIL', 'FLAKY', 'SKIPPED', 'BLOCKED', 'NOT_RUN', 'QUARANTINED']);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
class ContractError extends Error {}
function requireValue(condition, message) {
  if (!condition) throw new ContractError(message);
}
function fields(value, names, label) {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: expected object`);
  requireValue(Object.keys(value).every((key) => names.includes(key)), `${label}: unknown field`);
}
function identity(value, label) {
  requireValue(text(value.scenarioId) && text(value.targetId), `${label}: scenarioId and targetId required`);
  return JSON.stringify([value.scenarioId, value.targetId]);
}
function header(value, names, label) {
  fields(value, names, label);
  requireValue(value.version === 1 && text(value.runId) && text(value.buildId), `${label}: version 1, runId and buildId required`);
}
async function digest(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

async function check(planPath, resultPath, evidenceRoot) {
  const plan = JSON.parse(await readFile(planPath, 'utf8'));
  const result = JSON.parse(await readFile(resultPath, 'utf8'));
  header(plan, ['version', 'runId', 'buildId', 'required'], 'plan');
  header(result, ['version', 'runId', 'buildId', 'runnerExitCode', 'attempts'], 'result');
  requireValue(Array.isArray(plan.required) && plan.required.length > 0, 'plan: required must be nonempty');
  requireValue(Array.isArray(result.attempts), 'result: attempts must be an array');
  requireValue(Number.isInteger(result.runnerExitCode), 'result: runnerExitCode must be an integer');
  const required = new Map();
  for (const item of plan.required) {
    fields(item, ['scenarioId', 'targetId'], 'required item');
    const key = identity(item, 'required item');
    requireValue(!required.has(key), 'plan: duplicate required combination');
    required.set(key, []);
  }
  const problems = [];
  if (plan.runId !== result.runId || plan.buildId !== result.buildId) problems.push('run or build identity mismatch');
  if (result.runnerExitCode !== 0) problems.push('runner exited nonzero');
  const root = await realpath(evidenceRoot);
  requireValue((await stat(root)).isDirectory(), 'evidence root must be a directory');
  for (const attempt of result.attempts) {
    fields(attempt, ['scenarioId', 'targetId', 'attempt', 'status', 'evidence'], 'attempt');
    const key = identity(attempt, 'attempt');
    requireValue(required.has(key), 'result: unexpected scenario/target combination');
    requireValue(Number.isSafeInteger(attempt.attempt) && attempt.attempt > 0, 'attempt: positive integer required');
    requireValue(statuses.has(attempt.status), 'attempt: unsupported status');
    requireValue(Array.isArray(attempt.evidence), 'attempt: evidence array required');
    const attempts = required.get(key);
    requireValue(!attempts.some((other) => other.attempt === attempt.attempt), 'result: duplicate attempt');
    attempts.push(attempt);
    const label = `${key} attempt ${attempt.attempt}`;
    if (attempt.status !== 'PASS') problems.push(`${label}: ${attempt.status}`);
    if (attempt.status === 'PASS' && attempt.evidence.length === 0) problems.push(`${label}: missing evidence`);
    for (const evidence of attempt.evidence) {
      fields(evidence, ['path', 'sha256'], 'evidence');
      requireValue(text(evidence.path) && !isAbsolute(evidence.path), 'evidence: relative path required');
      requireValue(typeof evidence.sha256 === 'string' && /^[a-f0-9]{64}$/.test(evidence.sha256), 'evidence: lowercase SHA-256 required');
      try {
        const path = await realpath(resolve(root, evidence.path));
        const within = relative(root, path);
        requireValue(within !== '..' && !within.startsWith(`..${sep}`) && !isAbsolute(within), 'path escapes evidence root');
        const info = await stat(path);
        requireValue(info.isFile() && info.size > 0, 'evidence must be a nonempty regular file');
        requireValue(await digest(path) === evidence.sha256, 'evidence digest mismatch');
      } catch {
        problems.push(`${label}: evidence unavailable, outside root, empty, or digest mismatch`);
      }
    }
  }
  for (const [key, attempts] of required) {
    if (attempts.length === 0) problems.push(`${key}: missing result`);
    attempts.sort((a, b) => a.attempt - b.attempt);
    if (attempts.some((item, index) => item.attempt !== index + 1)) problems.push(`${key}: missing attempt history`);
  }
  return {
    gate: problems.length === 0 ? 'PASS' : 'FAIL',
    runId: plan.runId,
    buildId: plan.buildId,
    runnerExitCode: result.runnerExitCode,
    required: required.size,
    attempts: result.attempts.length,
    problems,
  };
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') {
  console.log('Usage: node check-run.mjs PLAN.json RESULT.json EVIDENCE_ROOT\nExit: 0 = records/evidence gate passed; 1 = incomplete/nonpassing; 2 = invalid input or invocation.\nDoes not run tests or certify evidence contents. See references/cli-verification.md.');
} else if (args.length !== 3) {
  console.log(JSON.stringify({ gate: 'ERROR', problems: ['expected PLAN.json RESULT.json EVIDENCE_ROOT'] }));
  process.exitCode = 2;
} else {
  try {
    const report = await check(...args);
    console.log(JSON.stringify(report));
    process.exitCode = report.gate === 'PASS' ? 0 : 1;
  } catch (error) {
    // Only authored contract diagnostics are safe; parser/OS errors can expose secrets.
    const problem = error instanceof ContractError
      ? error.message
      : 'invalid JSON or inaccessible input/evidence root; see the input contract';
    console.log(JSON.stringify({ gate: 'ERROR', problems: [problem] }));
    process.exitCode = 2;
  }
}
