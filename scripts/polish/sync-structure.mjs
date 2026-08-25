#!/usr/bin/env node
/**
 * Propagate the English structural edits into the eight translations.
 *
 * The editorial pass deleted array elements and object keys. A translation
 * cannot simply be truncated to the new length: deleting the third bullet in
 * English and the last bullet in Persian silently re-pairs every bullet after
 * it with the wrong text.
 *
 * So the deletions are recovered rather than assumed. The committed English and
 * the working English are aligned element by element with a small edit-distance
 * pass — an element that survived but was rewritten still aligns, because the
 * cost function scores shape and shared vocabulary rather than equality — and
 * the resulting delete list is verified by replaying it against the committed
 * English. If the replay does not reproduce the current structure exactly, the
 * script refuses to touch a translation.
 *
 *   node scripts/polish/sync-structure.mjs           # report
 *   node scripts/polish/sync-structure.mjs --write   # apply to all locales
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const LOCALES = ['ru', 'hy', 'tr', 'th', 'zh', 'ur', 'ar', 'fa'];
const FILES = ['common', 'home', 'about', 'capabilities', 'contact', 'industries-index',
  ...['agriculture','appliances','automotive','beverage','chemical','cosmetics','custom',
      'electrical','furniture','marine','medical','plumbing','toys'].map((i) => `industries/${i}`)];

const write = process.argv.includes('--write');

const words = (s) => new Set(String(s).toLowerCase().match(/[a-z0-9]+/g) ?? []);
const shape = (v) => Array.isArray(v) ? 'a' : (v && typeof v === 'object' ? Object.keys(v).sort().join(',') : typeof v);

/** 0 = identical, 1 = unrelated. Rewritten prose still scores well below 1. */
function cost(a, b) {
  if (JSON.stringify(a) === JSON.stringify(b)) return 0;
  if (shape(a) !== shape(b)) return 1;
  if (typeof a === 'string') {
    const A = words(a), B = words(b);
    if (!A.size || !B.size) return 0.5;
    let hit = 0; for (const w of A) if (B.has(w)) hit++;
    return 1 - hit / Math.max(A.size, B.size);
  }
  if (a && typeof a === 'object') {
    const keys = Object.keys(shape(a) === 'a' ? {} : a);
    if (!keys.length) return 0.4;
    return keys.reduce((s, k) => s + cost(a[k], b[k]), 0) / keys.length;
  }
  return 1;
}

/** Which indices of `oldArr` were deleted to produce `newArr`. */
function deletions(oldArr, newArr) {
  const n = oldArr.length, m = newArr.length;
  const DEL = 0.75;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  const from = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
  dp[0][0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (dp[i][j] === Infinity) continue;
      if (i < n && dp[i][j] + DEL < dp[i + 1][j]) { dp[i + 1][j] = dp[i][j] + DEL; from[i + 1][j] = 'del'; }
      if (i < n && j < m) {
        const c = dp[i][j] + cost(oldArr[i], newArr[j]);
        if (c < dp[i + 1][j + 1]) { dp[i + 1][j + 1] = c; from[i + 1][j + 1] = 'keep'; }
      }
    }
  }
  const out = [];
  let i = n, j = m;
  while (i > 0) {
    if (from[i][j] === 'del') { out.push(i - 1); i--; }
    else { i--; j--; }
  }
  return out.sort((a, b) => a - b);
}

/** Recursively derive the delete plan: array indices and object keys. */
export function plan(oldV, newV, path = '') {
  const ops = [];
  if (Array.isArray(oldV) && Array.isArray(newV)) {
    const del = oldV.length === newV.length ? [] : deletions(oldV, newV);
    if (del.length) ops.push({ path, kind: 'array', del });
    let j = 0;
    for (let i = 0; i < oldV.length; i++) {
      if (del.includes(i)) continue;
      ops.push(...plan(oldV[i], newV[j], `${path}[${i}]`));
      j++;
    }
    return ops;
  }
  if (oldV && typeof oldV === 'object' && newV && typeof newV === 'object') {
    for (const k of Object.keys(oldV)) {
      if (!(k in newV)) { ops.push({ path, kind: 'key', key: k }); continue; }
      ops.push(...plan(oldV[k], newV[k], path ? `${path}.${k}` : k));
    }
    return ops;
  }
  return ops;
}

const at = (root, path) => {
  if (!path) return root;
  let node = root;
  for (const m of path.matchAll(/([^.[\]]+)|\[(\d+)\]/g)) node = node[m[2] !== undefined ? Number(m[2]) : m[1]];
  return node;
};

/** Apply a plan to a document. Deepest and highest-index operations first. */
export function applyPlan(doc, ops) {
  const ordered = [...ops].sort((a, b) => (b.path.length - a.path.length));
  for (const op of ordered) {
    const node = at(doc, op.path);
    if (node == null) continue;
    if (op.kind === 'key') delete node[op.key];
    else for (const i of [...op.del].sort((a, b) => b - a)) node.splice(i, 1);
  }
  return doc;
}

const structure = (v) => JSON.stringify(v, (k, val) => (typeof val === 'string' ? 1 : val));

if (process.argv[1] && process.argv[1].endsWith('sync-structure.mjs')) {
let touched = 0, refused = 0;
for (const f of FILES) {
  const p = `src/content/en/${f}.json`;
  let head;
  try { head = JSON.parse(execSync(`git show HEAD:${p}`, { encoding: 'utf8' })); } catch { continue; }
  const now = JSON.parse(readFileSync(p, 'utf8'));
  const ops = plan(head, now);
  if (!ops.length) continue;

  // Replay against the committed English. If the shapes do not match exactly,
  // the alignment guessed wrong and no translation gets edited.
  const replay = applyPlan(JSON.parse(JSON.stringify(head)), ops);
  if (structure(replay) !== structure(now)) {
    console.log(`  ✗ ${f}: alignment did not reproduce the new structure — skipped`);
    refused++;
    continue;
  }

  const del = ops.reduce((s, o) => s + (o.kind === 'key' ? 1 : o.del.length), 0);
  console.log(`  ${f.padEnd(24)} ${del} deletion(s)`);
  touched++;
  if (!write) continue;
  for (const loc of LOCALES) {
    const lp = `src/content/${loc}/${f}.json`;
    let doc;
    try { doc = JSON.parse(readFileSync(lp, 'utf8')); } catch { continue; }
    applyPlan(doc, ops);
    writeFileSync(lp, JSON.stringify(doc, null, 2) + '\n');
  }
}
console.log(`\n  ${touched} file(s) planned${refused ? `, ${refused} refused` : ''}${write ? ', written to all eight locales' : ' (dry run)'}`);
}
