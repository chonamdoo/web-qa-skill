/** @param {any} report @param {any} bundle @param {any} cases @param {any} criteria */
export function assess(report, bundle, cases, criteria) {
  const problems = [];
  const blocked = [];
  const required = [];
  const attempts = [];
  const need = (condition, message) => { if (!condition) throw new Error(message); };
  const text = (x) => typeof x === 'string' && x.trim().length > 0;
  const hash = (x) => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
  need(report?.version === 1 && text(report.runId), 'report version1/runId required');
  if (report.bundleSha256 !== bundle.bundleSha256) problems.push('stale eval bundle');
  need(report.executor && text(report.executor.host) && text(report.executor.model), 'executor host/model required');
  if (report.executor.skillSha256 !== bundle.skillSha256) problems.push('executor used a different skill');
  if (report.executor.mode !== 'skill-behavior' || report.executor.freshContext !== true || report.executor.sourceLeakDetected !== false) problems.push('fresh uncontaminated skill execution required');
  const scenario = report.executor.scenarioEvidence;
  need(scenario && hash(scenario.sha256), 'generated scenario evidence required');
  need(Array.isArray(report.judgments) && Array.isArray(report.planning) && Array.isArray(report.controls) && Array.isArray(report.browsers), 'report arrays required');
  const statuses = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'UNVERIFIED']);
  function records(items, ids, targetId, prefix) {
    for (const id of ids) required.push({ scenarioId: prefix + id, targetId });
    for (const x of items) {
      need(ids.includes(x.id) && statuses.has(x.status), prefix + 'invalid id/status');
      need(text(x.reason) && Array.isArray(x.evidence), prefix + 'reason/evidence required');
      need(x.status !== 'PASS' || x.evidence.length > 0, prefix + 'PASS requires outcome evidence');
      if (x.status === 'FAIL') problems.push(prefix + x.id + ' failed');
      else if (x.status !== 'PASS') blocked.push(prefix + x.id + ' unverified');
      attempts.push({ scenarioId: prefix + x.id, targetId, attempt: x.attempt, status: x.status === 'UNVERIFIED' ? 'BLOCKED' : x.status, evidence: [...x.evidence, scenario] });
    }
    for (const id of ids) if (!items.some(x => x.id === id)) blocked.push(prefix + id + ' missing');
  }
  records(report.judgments, criteria.required.map(x => x.id), 'eval', 'criterion:');
  records(report.planning, cases.planning, 'planning', 'planning:');
  const targets = cases.targets.map(x => x.id);
  for (const b of report.browsers) {
    const target = cases.targets.find(x => x.id === b.targetId);
    need(target && !report.browsers.some(x => x !== b && x.targetId === b.targetId), 'unexpected/duplicate browser target');
    if (b.actual !== true || b.browser !== target.browser || b.width !== target.width || !text(b.version)) blocked.push(b.targetId + ' actual browser/width unverified');
  }
  for (const t of targets) if (!report.browsers.some(x => x.targetId === t)) blocked.push(t + ' browser missing');
  for (const f of cases.fixtures) for (const t of targets) required.push({ scenarioId: 'control:' + f.id, targetId: t });
  const faultIds = ['quantity-zero', 'quantity-blank', 'range-reversed', 'horizontal-overflow'];
  for (const c of report.controls) {
    const fixture = cases.fixtures.find(x => x.id === c.fixtureId);
    need(fixture && targets.includes(c.targetId) && statuses.has(c.status), 'invalid control fixture/target/status');
    const unexecuted = ['BLOCKED', 'NOT_RUN', 'UNVERIFIED'].includes(c.status);
    need((Number.isInteger(c.runnerExitCode) || (unexecuted && c.runnerExitCode === null)) && Array.isArray(c.assertions), 'control runner exit/assertions required');
    need(c.outcomeEvidence, 'control outcome/blocker evidence required');
    if (!unexecuted) need(c.suiteEvidence && c.mappingEvidence && hash(c.suiteEvidence.sha256), 'executed control suite/mapping evidence required');
    let status = 'PASS';
    if (unexecuted) { status = 'BLOCKED'; blocked.push(c.targetId + '/' + c.fixtureId + ' unexecuted'); }
    else {
      if (c.status !== fixture.expected_status || (c.status === 'PASS' ? c.runnerExitCode !== 0 : c.runnerExitCode === 0)) status = 'FAIL';
      for (const id of faultIds) {
        const matching = c.assertions.filter(x => x.id === id);
        const expected = fixture.faults[c.targetId].includes(id) ? 'FAIL' : 'PASS';
        if (matching.length !== 1 || !text(matching[0].sourceAssertionId) || matching[0].status !== expected || matching[0].oracle !== 'EXPLICIT' || (expected === 'FAIL' && matching[0].errorKind !== 'ASSERTION_MISMATCH')) status = 'FAIL';
      }
      if (c.assertions.some(x => !faultIds.includes(x.id) && x.status !== 'PASS')) status = 'FAIL';
      if (status === 'FAIL') problems.push(c.targetId + '/' + c.fixtureId + ' control failed');
    }
    attempts.push({ scenarioId: 'control:' + c.fixtureId, targetId: c.targetId, attempt: c.attempt, status, evidence: [c.outcomeEvidence, scenario, ...(c.suiteEvidence ? [c.suiteEvidence] : []), ...(c.mappingEvidence ? [c.mappingEvidence] : [])] });
  }
  for (const f of cases.fixtures) for (const t of targets) if (!report.controls.some(x => x.fixtureId === f.id && x.targetId === t)) blocked.push(t + '/' + f.id + ' control missing');
  for (const t of targets) {
    const hashes = new Set(report.controls.filter(x => x.targetId === t && x.suiteEvidence).map(x => x.suiteEvidence.sha256));
    if (hashes.size > 1) problems.push(t + ' control assertions changed between fixtures/attempts');
  }
  const m = report.measurements;
  need(m && ['rawTextBytes', 'summaryBytes', 'imageBytes'].every(k => Number.isSafeInteger(m[k]) && m[k] >= 0), 'measured artifact byte counts required');
  need(m.modelTokens === null || (Number.isSafeInteger(m.modelTokens) && m.modelTokens >= 0), 'modelTokens must be measured integer or null');
  return { problems, blocked, required, attempts };
}
