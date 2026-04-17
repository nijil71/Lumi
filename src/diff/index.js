// ─── lumi-cli / diff ──────────────────────────────────────────────────────

import { writeln, c as colors, cols } from '../ansi.js';

// Guard: if the LCS table would exceed this many cells, we fall back to a
// naive line-by-line diff (equal lines are matched in order, everything else
// is add/remove). ~4M cells ≈ 16MB for Int32, comfortably fast.
const LCS_CELL_LIMIT = 4_000_000;

// ─── LCS-based line differ ────────────────────────────────────────────────

/**
 * Compute a line-level diff via Myers' diff algorithm (linear space O(N+M)).
 * Returns hunks: { type: 'equal'|'add'|'remove', value: string }[]
 */
function computeDiff(aLines, bLines) {
  const m = aLines.length;
  const n = bLines.length;

  if (m === 0 && n === 0) return [];
  if (m === 0) return bLines.map(v => ({ type: 'add', value: v }));
  if (n === 0) return aLines.map(v => ({ type: 'remove', value: v }));

  const hunks = [];

  function solve(a0, a1, b0, b1) {
    if (a0 >= a1) {
      for (let i = b0; i < b1; i++) hunks.push({ type: 'add', value: bLines[i] });
      return;
    }
    if (b0 >= b1) {
      for (let i = a0; i < a1; i++) hunks.push({ type: 'remove', value: aLines[i] });
      return;
    }

    // Direct match optimization for prefix/suffix
    while (a0 < a1 && b0 < b1 && aLines[a0] === bLines[b0]) {
      hunks.push({ type: 'equal', value: aLines[a0] });
      a0++; b0++;
    }
    if (a0 >= a1 || b0 >= b1) return solve(a0, a1, b0, b1);

    const suffixHunks = [];
    while (a0 < a1 && b0 < b1 && aLines[a1 - 1] === bLines[b1 - 1]) {
      suffixHunks.unshift({ type: 'equal', value: aLines[a1 - 1] });
      a1--; b1--;
    }

    const { x, y } = findMiddleSnake(a0, a1, b0, b1);
    solve(a0, x, b0, y);
    solve(x, a1, y, b1);
    for (const h of suffixHunks) hunks.push(h);
  }

  /** Find the middle snake of the two sequences in linear space */
  function findMiddleSnake(a0, a1, b0, b1) {
    const N = a1 - a0;
    const M = b1 - b0;
    const delta = N - M;
    const size = N + M + 2;
    const kv = new Int32Array(size * 2 + 1);
    const rv = new Int32Array(size * 2 + 1);

    kv.fill(-1);
    rv.fill(-1);

    const offset = size;

    for (let d = 0; d <= Math.ceil((N + M) / 2); d++) {
      // Forward
      for (let k = -d; k <= d; k += 2) {
        let x, y;
        if (k === -d || (k !== d && kv[k - 1 + offset] < kv[k + 1 + offset])) {
          x = kv[k + 1 + offset];
        } else {
          x = kv[k - 1 + offset] + 1;
        }
        y = x - k;
        if (d === 0) x = 0, y = 0;

        while (x < N && y < M && aLines[a0 + x] === bLines[b0 + y]) {
          x++; y++;
        }
        kv[k + offset] = x;

        if (delta % 2 !== 0 && k >= delta - (d - 1) && k <= delta + (d - 1)) {
          if (kv[k + offset] >= (N - rv[delta - k + offset])) {
            return { x: a0 + x, y: b0 + y };
          }
        }
      }

      // Backward
      for (let k = -d; k <= d; k += 2) {
        let x, y;
        if (k === -d || (k !== d && rv[k - 1 + offset] < rv[k + 1 + offset])) {
          x = rv[k + 1 + offset];
        } else {
          x = rv[k - 1 + offset] + 1;
        }
        y = x - k;
        if (d === 0) x = 0, y = 0;

        while (x < N && y < M && aLines[a1 - 1 - x] === bLines[b1 - 1 - y]) {
          x++; y++;
        }
        rv[k + offset] = x;

        if (delta % 2 === 0 && k >= -delta - d && k <= -delta + d) {
          if (rv[k + offset] >= (N - kv[-delta - k + offset])) {
            return { x: a1 - x, y: b1 - y };
          }
        }
      }
    }
    // Fallback
    return { x: a0 + Math.floor(N / 2), y: b0 + Math.floor(M / 2) };
  }

  solve(0, m, 0, n);
  return hunks;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Print a colored line-by-line diff between two strings.
 * Added lines are green (+), removed are red (─), context is dim.
 *
 * @param {string} oldText
 * @param {string} newText
 * @param {object} options
 * @param {number} [options.context=3]         - Context lines around each change
 * @param {string} [options.oldLabel='─ old']  - Left/old label
 * @param {string} [options.newLabel='+ new']  - Right/new label
 * @param {boolean}[options.lineNumbers=true]  - Show line numbers
 *
 * @example
 * diff('const x = 1;\nconst y = 2;', 'const x = 1;\nconst z = 3;');
 */
export function diff(oldText, newText, options = {}) {
  const context     = options.context     !== undefined ? options.context : 3;
  const oldLabel    = options.oldLabel    ?? '─ old';
  const newLabel    = options.newLabel    ?? '+ new';
  const showNums    = options.lineNumbers !== false;

  const aLines = oldText.split('\n');
  const bLines = newText.split('\n');
  const hunks  = computeDiff(aLines, bLines);

  // Column ruler
  const w = Math.min(cols(), 88);

  // Header
  writeln(`${colors.signal}${colors.b}  ${oldLabel}${colors.r}`);
  writeln(`${colors.sage}${colors.b}  ${newLabel}${colors.r}`);
  writeln(`${colors.graphite}${'─'.repeat(w)}${colors.r}`);

  if (hunks.length === 0 || hunks.every(h => h.type === 'equal')) {
    writeln(`${colors.slate}  (no differences)${colors.r}`);
    return;
  }

  // Mark which hunk indices should be printed (changes + context)
  const visible = new Set();
  for (let idx = 0; idx < hunks.length; idx++) {
    if (hunks[idx].type !== 'equal') {
      for (let d = -context; d <= context; d++) {
        const k = idx + d;
        if (k >= 0 && k < hunks.length) visible.add(k);
      }
    }
  }

  // Track source line numbers separately for old (a) and new (b)
  let aLine = 1, bLine = 1;
  let gapPrinted = false;

  for (let idx = 0; idx < hunks.length; idx++) {
    const { type, value } = hunks[idx];

    if (!visible.has(idx)) {
      // Advance counters without printing
      if (type === 'equal')  { aLine++; bLine++; }
      if (type === 'remove') { aLine++; }
      if (type === 'add')    { bLine++; }
      if (!gapPrinted) {
        writeln(`${colors.slate}  ···${colors.r}`);
        gapPrinted = true;
      }
      continue;
    }
    gapPrinted = false;

    if (type === 'equal') {
      const num = showNums ? `${colors.graphite}${String(aLine).padStart(4)} ${colors.r}` : '';
      writeln(`${num}${colors.graphite}  ${value}${colors.r}`);
      aLine++; bLine++;
    } else if (type === 'remove') {
      const num = showNums ? `${colors.signal}${String(aLine).padStart(4)} ${colors.r}` : '';
      writeln(`${num}${colors.signal}─ ${value}${colors.r}`);
      aLine++;
    } else {
      const num = showNums ? `${colors.sage}${String(bLine).padStart(4)} ${colors.r}` : '';
      writeln(`${num}${colors.sage}+ ${value}${colors.r}`);
      bLine++;
    }
  }

  writeln(`${colors.graphite}${'─'.repeat(w)}${colors.r}`);
}
