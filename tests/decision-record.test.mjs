import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readJson } from '../evals/scripts/assets.mjs';

const record = await readJson('docs/validation/decision-checks.json');
const cases = await readJson('evals/cases.json');
const inputs = new Map((await readJson(cases.decision_inputs)).map(x => [x.id, x.request]));
const acceptance = (await readJson('evals/criteria.json')).decision_acceptance;

/** Binds a recorded session to the exact executor inputs and evaluator criteria it was judged against. @param {string[]} ids */
function decisionCasesSha256(ids) {
  return createHash('sha256').update(JSON.stringify(ids.map(id => ({ id, request: inputs.get(id), acceptance: acceptance[id] })))).digest('hex');
}

test('recorded sessions match the current decision cases and criteria', () => {
  for (const session of record.sessions) {
    for (const id of session.case_ids) assert.ok(inputs.has(id), `${session.id}: unknown case ${id}`);
    assert.equal(session.cases_sha256, decisionCasesSha256(session.case_ids), `${session.id}: cases changed since the recorded run; rerun and record a new session`);
  }
});

test('every decision case has a recorded run', () => {
  const covered = new Set(record.sessions.flatMap(session => session.case_ids));
  assert.deepEqual(cases.decisions.filter(id => !covered.has(id)), []);
});

test('each run judges exactly its session cases and the summary recomputes', () => {
  /** @type {Record<string, {runs: number, pass: number, fail: number}>} */
  const summary = {};
  for (const session of record.sessions) {
    for (const run of session.runs) {
      assert.deepEqual(Object.keys(run.results).sort(), [...session.case_ids].sort(), `${session.id}/${run.arm}#${run.repeat}`);
      const counts = summary[`${session.id}/${run.arm}`] ??= { runs: 0, pass: 0, fail: 0 };
      counts.runs += 1;
      for (const judgment of Object.values(run.results)) {
        assert.ok(judgment === 'pass' || judgment === 'fail', `invalid judgment ${judgment}`);
        counts[judgment] += 1;
      }
    }
  }
  assert.deepEqual(record.summary, summary);
});
