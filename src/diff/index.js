// ─── lumi-cli / diff ──────────────────────────────────────────────────────

import { writeln, c as colors, cols } from '../ansi.js';

// ─── LCS-based line differ ────────────────────────────────────────────────

/**
 * Compute a line-level diff via LCS backtracking.
 * Returns hunks: { type: 'equal'|'add'|'remove', value: string }[]
 */
function computeDiff(aLines, bLines) {
  const m = aLines.length;
  const n = bLines.length;

  // Build LCS table with Int32Array for efficiency
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = aLines[i - 1] === bLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to reconstruct diff
  const hunks = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      hunks.unshift({ type: 'equal',  value: aLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      hunks.unshift({ type: 'add',    value: bLines[j - 1] });
      j--;
    } else {
      hunks.unshift({ type: 'remove', value: aLines[i - 1] });
      i--;
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

  if (hunks.length === 0) {
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
