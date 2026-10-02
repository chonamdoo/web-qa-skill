import { createHash } from 'node:crypto';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { Script } from 'node:vm';

export const digest = (value) => createHash('sha256').update(value).digest('hex');
/** @param {string} root */
export async function loadAssets(root) {
  const cases = JSON.parse(await readFile(join(root, 'evals/cases.json'), 'utf8'));
  const criteria = JSON.parse(await readFile(join(root, 'evals/criteria.json'), 'utf8'));
  if (cases.version !== 1 || criteria.version !== 1) throw new Error('unsupported eval asset version');
  const expected = ['chrome-1024', 'chrome-1280', 'safari-1024', 'safari-1280'];
  if (JSON.stringify(cases.targets.map(x => x.id).sort()) !== JSON.stringify(expected) || !cases.targets.every(x => x.id === x.browser + '-' + x.width)) throw new Error('desktop-only target matrix required');
  if (JSON.stringify(cases.fixtures.map(x => x.id).sort()) !== JSON.stringify(['corrected', 'faulty'])) throw new Error('faulty/corrected fixtures required');
  if (criteria.required.length !== 10 || new Set(criteria.required.map(x => x.id)).size !== 10 || !criteria.required.every(x => x.id && x.acceptance && x.source && x.evidence)) throw new Error('invalid required criteria');
  const planning = JSON.parse(await readFile(join(root, cases.planning_inputs), 'utf8'));
  if (JSON.stringify(planning.map(x => x.id)) !== JSON.stringify(cases.planning) || !cases.planning.every(id => criteria.planning_acceptance[id]?.length)) throw new Error('planning case/criteria mismatch');
  const prompt = await readFile(join(root, cases.executor_prompt), 'utf8');
  if (!prompt.includes('{{URL}}')) throw new Error('URL-only prompt missing URL slot');
  for (const f of cases.fixtures) {
    if (!/^evals\/fixtures\/[a-z-]+\.html$/.test(f.path)) throw new Error('invalid fixture path');
    const html = await readFile(join(root, f.path), 'utf8');
    const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
    if (!scripts.length) throw new Error('interactive fixture script missing');
    for (const s of scripts) new Script(s[1]);
    if (!html.includes('Quantity (1–3)') || !html.includes('Min price must not exceed Max price.')) throw new Error('explicit fixture rules missing');
  }
  const files = {};
  async function walk(rel) {
    for (const name of (await readdir(join(root, rel))).sort()) {
      const path = rel + '/' + name;
      const info = await lstat(join(root, path));
      if (info.isSymbolicLink()) throw new Error('eval bundle symlink forbidden');
      if (info.isDirectory()) await walk(path);
      else files[path] = digest(await readFile(join(root, path)));
    }
  }
  for (const dir of ['skills/web-qa', 'evals/fixtures', 'evals/prompts', 'evals/scripts', 'tests', '.github/workflows']) await walk(dir);
  for (const path of ['evals/criteria.json', 'evals/cases.json', 'evals/README.md', 'README.md', 'package.json', 'package-lock.json', 'tsconfig.json']) files[path] = digest(await readFile(join(root, path)));
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  const skill = Object.fromEntries(Object.entries(sorted).filter(([path]) => path.startsWith('skills/web-qa/')));
  return { cases, criteria, bundle: { version: 1, bundleSha256: digest(JSON.stringify(sorted)), skillSha256: digest(JSON.stringify(skill)), files: sorted } };
}
