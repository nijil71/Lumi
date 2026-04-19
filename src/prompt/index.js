// ─── lumi-cli / prompt ────────────────────────────────────────────────────
// Zero-dependency interactive prompts — confirm, select, input.
// Falls back gracefully in non-TTY environments (CI, piped stdin).

import { write, writeln, ansi, c as colors, isTTY, registerCleanup } from '../ansi.js';

// ─── Key constants ────────────────────────────────────────────────────────

const CTRL_C = '\x03';
const ENTER  = '\r';
const LF     = '\n';
const UP     = '\x1b[A';
const DOWN   = '\x1b[B';
const BSP    = '\x7f';   // DEL key sends 0x7F on most systems
const CTRL_H = '\x08';   // Backspace on some systems

/** Detect an Enter-ish key (handles \r, \n, \r\n) */
function isEnter(key) {
  return key === ENTER || key === LF || key === '\r\n';
}

/**
 * Extract printable characters from a keystroke chunk.
 * Handles multi-byte paste and multi-codepoint input (emoji via IME, CJK
 * input methods, terminal paste). Skips control chars and escape sequences.
 */
function extractPrintable(key) {
  // If the chunk starts with ESC, it's a control sequence we don't recognise;
  // drop entirely. Escape-sequence detection here is intentionally permissive.
  if (key.length === 0 || key[0] === '\x1b') return '';
  let out = '';
  for (const ch of key) {
    const cp = ch.codePointAt(0);
    // Skip control chars (0x00-0x1F and 0x7F). Accept the full Unicode range
    // above 0x1F so emoji and CJK input works.
    if (cp < 0x20 || cp === 0x7F) continue;
    out += ch;
  }
  return out;
}

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
    const unregister = registerCleanup(() => {
      process.stdin.removeListener('data', listener);
      closeRaw();
    });

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        write(ansi.show() + '\n');
        process.exit(130);
      }
      const result = handler(key);
      if (result !== undefined) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
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
    if (isEnter(key)) return dflt;
  });

  // Replace prompt line with settled result
  write(ansi.clearLine());
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

  const initialCursor = items.findIndex(i => i.value === options.default);
  let cursor       = initialCursor >= 0 ? initialCursor : 0;
  let linesDrawn   = 0;

  function render() {
    // Rewind to top of previously drawn block
    if (linesDrawn > 0) write(ansi.up(linesDrawn));

    // Header
    write(ansi.clearLine());
    write(`${colors.azure}?${colors.r} ${colors.chalk}${colors.b}${message}${colors.r}\n`);

    // Choices
    for (let i = 0; i < items.length; i++) {
      write(ansi.clearLine());
      if (i === cursor) {
        write(`  ${colors.azure}❯${colors.r} ${colors.chalk}${items[i].label}${colors.r}\n`);
      } else {
        write(`  ${colors.slate}  ${items[i].label}${colors.r}\n`);
      }
    }

    linesDrawn = items.length + 1;
  }

  render();

  // Ensure we always restore cursor on unexpected exit
  const unregister = registerCleanup(() => {
    if (linesDrawn > 0) write(ansi.up(linesDrawn) + ansi.clearDown());
    write(ansi.show());
  });

  // Arrow-key loop
  const selected = await new Promise((resolve) => {
    openRaw();

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        write(ansi.up(linesDrawn) + ansi.clearDown());
        write(ansi.show() + '\n');
        process.exit(130);
      }
      if (key === UP)   { cursor = (cursor - 1 + items.length) % items.length; render(); }
      if (key === DOWN) { cursor = (cursor + 1)                % items.length; render(); }
      if (isEnter(key)) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        resolve(items[cursor].value);
      }
    }

    process.stdin.on('data', listener);
  });

  // Collapse the menu to a single settled line
  write(ansi.up(linesDrawn) + ansi.clearDown());
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
    write(ansi.clearLine());
    const display = password
      ? `${colors.slate}${'●'.repeat([...value].length)}${colors.r}`
      : value
        ? `${colors.chalk}${value}${colors.r}`
        : `${colors.graphite}${placeholder}${colors.r}`;
    write(
      `${colors.azure}?${colors.r} ${colors.chalk}${colors.b}${message}${colors.r} ` +
      `${colors.graphite}›${colors.r} ${display}`
    );
  }

  renderLine();

  const unregister = registerCleanup(() => {
    write(ansi.show());
  });

  const result = await new Promise((resolve) => {
    openRaw();

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        write('\n' + ansi.show());
        process.exit(130);
      }
      if (isEnter(key)) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        resolve(value || defaultVal);
        return;
      }
      if (key === BSP || key === CTRL_H) {
        // Pop last Unicode code point (handles emoji correctly)
        const chars = [...value];
        chars.pop();
        value = chars.join('');
      } else {
        // Accept pasted text, emoji, CJK input and multi-byte chunks.
        // Old code only accepted single-byte ASCII (key.length === 1 && key >= ' ').
        const printable = extractPrintable(key);
        if (printable) value += printable;
      }
      renderLine();
    }

    process.stdin.on('data', listener);
  });

  // Settle the line
  write(ansi.clearLine());
  const display = password ? '●'.repeat([...result].length) : result;
  writeln(
    `${colors.sage}✔${colors.r} ${colors.chalk}${colors.b}${message}${colors.r}  ` +
    `${colors.azure}${display}${colors.r}`
  );

  return result;
}

// ─── multiSelect ──────────────────────────────────────────────────────────

/**
 * Arrow-key multiple choice selection. Returns `Promise<string[]>`.
 * Space to toggle, Enter to submit.
 */
export async function multiSelect(message, choices, options = {}) {
  if (!choices || choices.length === 0) {
    throw new Error('lumi multiSelect: choices must be a non-empty array');
  }

  const items = choices.map(c =>
    typeof c === 'string' ? { label: c, value: c } : c
  );

  const selectedValues = new Set(options.default || []);

  if (!isTTY()) {
    writeln(
      `${colors.azure}?${colors.r} ${colors.b}${message}${colors.r} ` +
      `${colors.slate}[non-interactive — using defaults]${colors.r}`
    );
    return Array.from(selectedValues);
  }

  write(ansi.hide());

  // Start the cursor on the first pre-selected item (if any), otherwise 0.
  let cursor = 0;
  if (selectedValues.size > 0) {
    const firstSelected = items.findIndex(i => selectedValues.has(i.value));
    if (firstSelected >= 0) cursor = firstSelected;
  }
  let linesDrawn = 0;

  function render() {
    if (linesDrawn > 0) {
      write(ansi.up(linesDrawn) + ansi.clearDown());
    }

    const counter = selectedValues.size
      ? `${colors.sage}${selectedValues.size} selected${colors.r}`
      : `${colors.slate}0 selected${colors.r}`;
    write(
      `${colors.azure}?${colors.r} ${colors.chalk}${colors.b}${message}${colors.r} ` +
      `${colors.slate}(Space to toggle · Enter to confirm)${colors.r}  ` +
      `${colors.slate}[${counter}${colors.slate}]${colors.r}\n`
    );

    const MAX_ROWS = 10;
    const startIndex = Math.max(0, Math.min(cursor - Math.floor(MAX_ROWS / 2), items.length - MAX_ROWS));
    const slice = items.slice(startIndex, Math.max(startIndex + MAX_ROWS, startIndex + items.length));

    for (let i = 0; i < slice.length; i++) {
      const idx = startIndex + i;
      const isSelected = selectedValues.has(slice[i].value);
      const symbol = isSelected ? `${colors.sage}◉${colors.r}` : `${colors.slate}◯${colors.r}`;

      if (idx === cursor) {
        write(`  ${colors.azure}❯${colors.r} ${symbol} ${colors.chalk}${slice[i].label}${colors.r}\n`);
      } else {
        write(`    ${symbol} ${colors.slate}${slice[i].label}${colors.r}\n`);
      }
    }

    linesDrawn = slice.length + 1;
  }

  render();
  const SPACE = ' ';

  const unregister = registerCleanup(() => {
    if (linesDrawn > 0) write(ansi.up(linesDrawn) + ansi.clearDown());
    write(ansi.show());
  });

  const finalSelection = await new Promise((resolve) => {
    openRaw();

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        write(ansi.up(linesDrawn) + ansi.clearDown());
        write(ansi.show() + '\n');
        process.exit(130);
      }
      if (key === UP)   { cursor = (cursor - 1 + items.length) % items.length; render(); }
      if (key === DOWN) { cursor = (cursor + 1)                % items.length; render(); }
      if (key === SPACE) {
        const val = items[cursor].value;
        if (selectedValues.has(val)) selectedValues.delete(val);
        else selectedValues.add(val);
        render();
      }
      if (isEnter(key)) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        resolve(Array.from(selectedValues));
      }
    }

    process.stdin.on('data', listener);
  });

  write(ansi.up(linesDrawn) + ansi.clearDown());
  const selectedLabels = items.filter(i => finalSelection.includes(i.value)).map(i => i.label).join(', ');
  writeln(
    `${colors.sage}✔${colors.r} ${colors.chalk}${colors.b}${message}${colors.r}  ` +
    `${colors.azure}${selectedLabels || 'none'}${colors.r}`
  );
  write(ansi.show());

  return finalSelection;
}

// ─── autocomplete ─────────────────────────────────────────────────────────

/**
 * Filterable choice selection. Returns `Promise<string>`.
 */
export async function autocomplete(message, choices) {
  if (!choices || choices.length === 0) {
    throw new Error('lumi autocomplete: choices must be a non-empty array');
  }

  const allItems = choices.map(c =>
    typeof c === 'string' ? { label: c, value: c } : c
  );

  if (!isTTY()) {
    writeln(
      `${colors.azure}?${colors.r} ${colors.b}${message}${colors.r} ` +
      `${colors.slate}[non-interactive — using: ${allItems[0].label}]${colors.r}`
    );
    return allItems[0].value;
  }

  write(ansi.hide());

  let cursor = 0;
  let query = '';
  let filtered = [...allItems];
  let linesDrawn = 0;

  function render() {
    if (linesDrawn > 0) {
      write(ansi.up(linesDrawn) + ansi.clearDown());
    }

    write(`${colors.azure}?${colors.r} ${colors.chalk}${colors.b}${message}${colors.r} ` +
      `${colors.graphite}›${colors.r} ${colors.chalk}${query}${colors.b}_${colors.r}\n`);

    const MAX_ROWS = 7;
    const startIndex = Math.max(0, Math.min(cursor - Math.floor(MAX_ROWS / 2), filtered.length - MAX_ROWS));
    const slice = filtered.slice(startIndex, startIndex + MAX_ROWS);

    for (let i = 0; i < slice.length; i++) {
      const idx = startIndex + i;
      if (idx === cursor) {
        write(`  ${colors.azure}❯${colors.r} ${colors.chalk}${slice[i].label}${colors.r}\n`);
      } else {
        write(`  ${colors.slate}  ${slice[i].label}${colors.r}\n`);
      }
    }

    if (filtered.length === 0) {
      write(`  ${colors.slate}  no matches · keep typing or ${colors.d}Esc${colors.r}${colors.slate} to cancel${colors.r}\n`);
      linesDrawn = 2; // message + 1 for 'no matches'
    } else {
      linesDrawn = slice.length + 1;
    }
  }

  render();

  const unregister = registerCleanup(() => {
    if (linesDrawn > 0) write(ansi.up(linesDrawn) + ansi.clearDown());
    write(ansi.show());
  });

  const selected = await new Promise((resolve) => {
    openRaw();

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        write(ansi.up(linesDrawn) + ansi.clearDown());
        write(ansi.show() + '\n');
        process.exit(130);
      }

      let needsRender = false;

      if (key === '\x1b') {   // bare Esc — cancel
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        resolve(null);
        return;
      }
      if (key === UP) {
        cursor = filtered.length ? (cursor - 1 + filtered.length) % filtered.length : 0;
        needsRender = true;
      } else if (key === DOWN) {
        cursor = filtered.length ? (cursor + 1) % filtered.length : 0;
        needsRender = true;
      } else if (isEnter(key)) {
        if (filtered.length > 0) {
          process.stdin.removeListener('data', listener);
          closeRaw();
          unregister();
          resolve(filtered[cursor].value);
        }
        return;
      } else if (key === BSP || key === CTRL_H) {
        if (query.length > 0) {
          const chars = [...query];
          chars.pop();
          query = chars.join('');
          filtered = allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));
          cursor = 0;
          needsRender = true;
        }
      } else {
        const printable = extractPrintable(key);
        if (printable) {
          query += printable;
          filtered = allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));
          cursor = 0;
          needsRender = true;
        }
      }

      if (needsRender) render();
    }

    process.stdin.on('data', listener);
  });

  write(ansi.up(linesDrawn) + ansi.clearDown());
  if (selected === null) {
    writeln(
      `${colors.slate}✗${colors.r} ${colors.chalk}${colors.b}${message}${colors.r}  ` +
      `${colors.slate}cancelled${colors.r}`
    );
  } else {
    const selectedItem  = allItems.find(i => i.value === selected);
    const selectedLabel = selectedItem ? selectedItem.label : String(selected);
    writeln(
      `${colors.sage}✔${colors.r} ${colors.chalk}${colors.b}${message}${colors.r}  ` +
      `${colors.azure}${selectedLabel}${colors.r}`
    );
  }
  write(ansi.show());

  return selected;
}
