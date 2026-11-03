/**
 * Whether JSON text already accepted by JSON.parse repeats a member name within one object.
 * JSON.parse silently keeps the last duplicate, which can turn a recorded FAIL into PASS.
 * Every member contributes one colon outside strings, so a parsed key count lower than
 * that colon count means a duplicate, without reimplementing JSON unescaping.
 * @param {string} text
 * @param {unknown} value JSON.parse(text)
 * @returns {boolean}
 */
export function hasDuplicateKeys(text, value) {
  let members = 0;
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (inString) {
      if (code === 0x5c) i += 1;
      else if (code === 0x22) inString = false;
    } else if (code === 0x22) inString = true;
    else if (code === 0x3a) members += 1;
  }
  let keys = 0;
  /** @type {unknown[]} */
  const pending = [value];
  while (pending.length > 0) {
    const item = pending.pop();
    if (item === null || typeof item !== 'object') continue;
    const children = Array.isArray(item) ? item : Object.values(item);
    if (!Array.isArray(item)) keys += children.length;
    for (const child of children) pending.push(child);
  }
  return members !== keys;
}
