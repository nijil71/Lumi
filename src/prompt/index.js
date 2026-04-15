// ─── lumi-cli / prompt ────────────────────────────────────────────────────
// Zero-dependency interactive prompts — confirm, select, input.
// Falls back gracefully in non-TTY environments (CI, piped stdin).

import { write, writeln, ansi, c as colors, isTTY } from '../ansi.js';

// ─── Key constants ────────────────────────────────────────────────────────

const CTRL_C = '\x03';
const ENTER  = '\r';
const UP     = '\x1b[A';
const DOWN   = '\x1b[B';
const BSP    = '\x7f';   // DEL key sends 0x7F on most systems
const CTRL_H = '\x08';   // Backspace on some systems

// ─── Raw stdin helpers ────────────────────────────────────────────────────

function openRaw() {
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
}

function closeRaw() {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();
}

/**
 * Wait for one keypress that satisfies handler(key) → value !== undefined.
 * Returns the first non-undefined value the handler produces.
 * Ctrl+C always exits (code 130).
 */
function waitForKey(handler) {
  return new Promise((resolve) => {
    openRaw();

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        write(ansi.show() + '\n');
        process.exit(130);
      }
      const result = handler(key);
      if (result !== undefined) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        resolve(result);
      }
    }

    process.stdin.on('data', listener);
  });
}

// ─── confirm ──────────────────────────────────────────────────────────────

/**
 * Ask a yes/no question. Returns `Promise<boolean>`.
 *
 * @param {string}  message
 * @param {object}  [options]
 * @param {boolean} [options.default=true]  - Which answer Enter selects
 *
 * @example
 * const ok = await confirm('Deploy to production?');
 * if (!ok) process.exit(0);
 */
export async function confirm(message, options = {}) {
  const dflt = options.default !== false;

  if (!isTTY()) {
    writeln(
      `${colors.azure}?${colors.r} ${colors.b}${message}${colors.r} ` +
      `${colors.slate}[non-interactive — default: ${dflt ? 'yes' : 'no'}]${colors.r}`
    );
    return dflt;
  }

  write(ansi.hide());
  write(
    `${colors.azure}?${colors.r} ${colors.chalk}${colors.b}${message}${colors.r} ` +
    `${colors.slate}${dflt ? 'Y/n' : 'y/N'}${colors.r} `
  );

  const answer = await waitForKey((key) => {
    const k = key.toLowerCase();
    if (k === 'y') return true;
    if (k === 'n') return false;
    if (key === ENTER) return dflt;
  });

  // Replace prompt line with settled result
  write(ansi.col(1) + ansi.clearLine());
  const sym    = answer ? `${colors.sage}✔${colors.r}` : `${colors.signal}✘${colors.r}`;
  const result = answer ? `${colors.sage}yes${colors.r}` : `${colors.signal}no${colors.r}`;
  writeln(`${sym} ${colors.chalk}${colors.b}${message}${colors.r}  ${result}`);
  write(ansi.show());

  return answer;
}

// ─── select ───────────────────────────────────────────────────────────────

/**
 * Arrow-key choice selection from a list. Returns `Promise<string>`.
 *
 * @param {string}                      message
 * @param {string[] | {label,value}[]}  choices
 * @param {object}  [options]
 * @param {string}  [options.default]   - Pre-selected value
 *
 * @example
 * const env = await select('Deploy to:', ['dev', 'staging', 'production']);
 */
export async function select(message, choices, options = {}) {
  if (!choices || choices.length === 0) {
    throw new Error('lumi select: choices must be a non-empty array');
  }

  // Normalize to { label, value }
  const items = choices.map(c =>
    typeof c === 'string' ? { label: c, value: c } : c
  );

  if (!isTTY()) {
    writeln(
      `${colors.azure}?${colors.r} ${colors.b}${message}${colors.r} ` +
      `${colors.slate}[non-interactive — using: ${items[0].label}]${colors.r}`
    );
    return items[0].value;
  }

  write(ansi.hide());

  let cursor       = Math.max(0, items.findIndex(i => i.value === options.default));
  let linesDrawn   = 0;

  function render() {
    // Rewind to top of previously drawn block
    if (linesDrawn > 0) write(ansi.up(linesDrawn));

    // Header
    write(ansi.col(1) + ansi.clearLine());
    write(`${colors.azure}?${colors.r} ${colors.chalk}${colors.b}${message}${colors.r}\n`);

    // Choices
    for (let i = 0; i < items.length; i++) {
      write(ansi.col(1) + ansi.clearLine());
      if (i === cursor) {
        write(`  ${colors.azure}❯${colors.r} ${colors.chalk}${items[i].label}${colors.r}\n`);
      } else {
        write(`  ${colors.slate}  ${items[i].label}${colors.r}\n`);
      }
    }

    linesDrawn = items.length + 1;
  }

  render();

  // Arrow-key loop
  const selected = await new Promise((resolve) => {
    openRaw();

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        // Wipe the menu before exiting
        write(ansi.up(linesDrawn) + ansi.col(1) + ansi.clearDown());
        write(ansi.show() + '\n');
        process.exit(130);
      }
      if (key === UP)   { cursor = (cursor - 1 + items.length) % items.length; render(); }
      if (key === DOWN) { cursor = (cursor + 1)                % items.length; render(); }
      if (key === ENTER) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        resolve(items[cursor].value);
      }
    }

    process.stdin.on('data', listener);
  });

  // Collapse the menu to a single settled line
  write(ansi.up(linesDrawn) + ansi.col(1) + ansi.clearDown());
  writeln(
    `${colors.sage}✔${colors.r} ${colors.chalk}${colors.b}${message}${colors.r}  ` +
    `${colors.azure}${items[cursor].label}${colors.r}`
  );
  write(ansi.show());

  return selected;
}

// ─── input ────────────────────────────────────────────────────────────────

/**
 * Free-text input prompt. Returns `Promise<string>`.
 *
 * @param {string}  message
 * @param {object}  [options]
 * @param {string}  [options.default='']      - Pre-filled value (Enter accepts it)
 * @param {string}  [options.placeholder='']  - Ghost text shown when empty
 * @param {boolean} [options.password=false]  - Mask input with ●
 *
 * @example
 * const tag   = await input('Release tag:', { default: 'v1.0.0' });
 * const token = await input('API token:',  { password: true });
 */
export async function input(message, options = {}) {
  const defaultVal  = options.default     ?? '';
  const placeholder = options.placeholder ?? '';
  const password    = options.password    ?? false;

  if (!isTTY()) {
    writeln(
      `${colors.azure}?${colors.r} ${colors.b}${message}${colors.r} ` +
      `${colors.slate}[non-interactive — default: "${defaultVal}"]${colors.r}`
    );
    return defaultVal;
  }

  write(ansi.show()); // keep cursor visible during text entry

  let value = defaultVal;

  function renderLine() {
    write(ansi.col(1) + ansi.clearLine());
    const display = password
      ? `${colors.slate}${'●'.repeat(value.length)}${colors.r}`
      : value
        ? `${colors.chalk}${value}${colors.r}`
        : `${colors.graphite}${placeholder}${colors.r}`;
    write(
      `${colors.azure}?${colors.r} ${colors.chalk}${colors.b}${message}${colors.r} ` +
      `${colors.graphite}›${colors.r} ${display}`
    );
  }

  renderLine();

  const result = await new Promise((resolve) => {
    openRaw();

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        write('\n' + ansi.show());
        process.exit(130);
      }
      if (key === ENTER) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        resolve(value || defaultVal);
        return;
      }
      if (key === BSP || key === CTRL_H) {
        // Pop last Unicode code point (handles emoji correctly)
        const chars = [...value];
        chars.pop();
        value = chars.join('');
      } else if (key.length === 1 && key >= ' ') {
        // Printable character
        value += key;
      }
      renderLine();
    }

    process.stdin.on('data', listener);
  });

  // Settle the line
  write(ansi.col(1) + ansi.clearLine());
  const display = password ? '●'.repeat(result.length) : result;
  writeln(
    `${colors.sage}✔${colors.r} ${colors.chalk}${colors.b}${message}${colors.r}  ` +
    `${colors.azure}${display}${colors.r}`
  );

  return result;
}
