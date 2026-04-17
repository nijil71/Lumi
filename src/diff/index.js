// ─── lumi-cli / diff ──────────────────────────────────────────────────────

import { writeln, c as colors, cols } from '../ansi.js';

// Guard: if the LCS table would exceed this many cells, we fall back to a
// naive line-by-line diff (equal lines are matched in order, everything else
// is add/remove). ~4M cells ≈ 16MB for Int32, comfortably fast.
const LCS_CELL_LIMIT = 4_000_000;

// ─── LCS-based line differ ────────────────────────────────────────────────

/**
 * Compute a line-level diff via LCS backtracking.
 * Returns hunks: { type: 'equal'|'add'|'remove', value: string }[]
 *
 * Uses a single flat Int32Array (rather than an array-of-Int32Arrays) to
 * reduce per-row overhead. For inputs that would exceed the cell limit we
 * fall back to a simple anchor-based diff to avoid running out of memory.
 */
function computeDiff(aLines, bLines) {
  const m = aLines.length;
  const n = bLines.length;

  if (m === 0 && n === 0) return [];
  if (m === 0) return bLines.map(v => ({ type: 'add', value: v }));
  if (n === 0) return aLines.map(v => ({ type: 'remove', value: v }));

  if ((m + 1) * (n + 1) > LCS_CELL_LIMIT) {
    return naiveDiff(aLines, bLines);
  }

  const stride = n + 1;
  const dp = new Int32Array((m + 1) * stride);

  for (let i = 1; i <= m; i++) {
    const ai = aLines[i - 1];
    const base = i * stride;
    const prevBase = (i - 1) * stride;
    for (let j = 1; j <= n; j++) {
      dp[base + j] = ai === bLines[j - 1]
        ? dp[prevBase + (j - 1)] + 1
        : Math.max(dp[prevBase + j], dp[base + (j - 1)]);
    }
  }

  // Backtrack
  const hunks = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      hunks.unshift({ type: 'equal',  value: aLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i * stride + (j - 1)] >= dp[(i - 1) * stride + j])) {
      hunks.unshift({ type: 'add',    value: bLines[j - 1] });
      j--;
    } else {
      hunks.unshift({ type: 'remove', value: aLines[i - 1] });
      i--;
    }
  }
  return hunks;
}

/**
 * Fallback diff for very large inputs: walks both sides in lockstep, pairing
 * lines when they match and emitting add/remove otherwise. Not minimal, but
 * correct and bounded-memory.
 */
function naiveDiff(aLines, bLines) {
  const hunks = [];
  let i = 0, j = 0;
  while (i < aLines.length || j < bLines.length) {
    if (i < aLines.length && j < bLines.length && aLines[i] === bLines[j]) {
      hunks.push({ type: 'equal', value: aLines[i] });
      i++; j++;
    } else if (j < bLines.length && (i >= aLines.length || aLines[i] !== bLines[j])) {
      // Look ahead a few lines to see if the a-side will reappear soon — if
      // so, treat this b-line as an add; otherwise treat the a-line as a remove.
      const aheadLimit = Math.min(j + 20, bLines.length);
      let foundAhead = -1;
      if (i < aLines.length) {
        for (let k = j; k < aheadLimit; k++) {
          if (bLines[k] === aLines[i]) { foundAhead = k; break; }
        }
      }
      if (foundAhead > -1) {
        hunks.push({ type: 'add', value: bLines[j] });
        j++;
      } else if (i < aLines.length) {
        hunks.push({ type: 'remove', value: aLines[i] });
        i++;
      } else {
        hunks.push({ type: 'add', value: bLines[j] });
        j++;
      }
    } else {
      hunks.push({ type: 'remove', value: aLines[i] });
      i++;
    }
  }
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
