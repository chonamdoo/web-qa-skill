import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, lstat } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

const skillsRoot = resolve('skills');
const maintainerOnly = new Set(['tests', 'evals', '.github', '.git', 'node_modules']);

/** @param {string} dir @returns {Promise<string[]>} */
async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(path, ...await files(path));
    else out.push(path);
  }
  return out;
}

/** Top-level `key: value` and `key: >-` folded scalars, which is all SKILL.md frontmatter uses. @param {string} header */
function frontmatter(header) {
  /** @type {Record<string, string>} */
  const fields = {};
  let folded = '';
  for (const line of header.split('\n')) {
    const key = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (key) {
      assert.equal(fields[key[1]], undefined, `duplicate frontmatter key ${key[1]}`);
      folded = key[2] === '>-' || key[2] === '>' ? key[1] : '';
      fields[key[1]] = folded ? '' : key[2];
    } else if (folded && /^\s+\S/.test(line)) {
      fields[folded] = (fields[folded] ? fields[folded] + ' ' : '') + line.trim();
    } else {
      assert.equal(line.trim(), '', `unsupported frontmatter line: ${line}`);
    }
  }
  return fields;
}

const skills = (await readdir(skillsRoot, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name);

test('installable skills have valid metadata matching their directory', async () => {
  assert.ok(skills.length > 0, 'no installable skills');
  for (const name of skills) {
    const text = await readFile(join(skillsRoot, name, 'SKILL.md'), 'utf8');
    const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
    assert.ok(match, `${name}: SKILL.md must start with frontmatter`);
    const meta = frontmatter(match[1]);
    assert.deepEqual(Object.keys(meta).sort(), ['description', 'name'], name);
    assert.equal(meta.name, name, 'name must match the skill directory');
    assert.match(meta.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(meta.name.length <= 64);
    assert.ok(meta.description.length > 0 && meta.description.length <= 1024, `${name}: description length ${meta.description.length}`);
    assert.ok(match[2].trim(), `${name}: empty body`);
  }
});

test('local Markdown links resolve to files inside the installed skill', async () => {
  for (const name of skills) {
    const root = join(skillsRoot, name);
    for (const path of (await files(root)).filter(path => path.endsWith('.md'))) {
      const text = await readFile(path, 'utf8');
      for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
        const resolved = resolve(path, '..', decodeURIComponent(target.split('#')[0]));
        const label = `${relative(skillsRoot, path)} -> ${target}`;
        assert.ok(resolved.startsWith(root + sep), `${label} leaves the installed skill`);
        assert.ok((await lstat(resolved).catch(() => null))?.isFile(), `${label} is not a file`);
      }
    }
  }
});

test('maintainer-only material stays outside installable skills', async () => {
  for (const name of skills) {
    for (const path of await files(join(skillsRoot, name))) {
      const parts = relative(skillsRoot, path).split(sep);
      assert.ok(!parts.some(part => maintainerOnly.has(part)), `${relative(skillsRoot, path)} belongs outside skills/`);
    }
  }
});
