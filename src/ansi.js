// ─── ANSI escape utilities — zero dependencies ────────────────────────────

export const ESC = '\x1b[';

export const ansi = {
  // cursor
  up:        (n = 1) => `${ESC}${n}A`,
  down:      (n = 1) => `${ESC}${n}B`,
  right:     (n = 1) => `${ESC}${n}C`,
  left:      (n = 1) => `${ESC}${n}D`,
  col:       (n = 1) => `${ESC}${n}G`,
  pos:       (r, c)  => `${ESC}${r};${c}H`,
  hide:      () => `${ESC}?25l`,
  show:      () => `${ESC}?25h`,
  save:      () => `\x1b7`,
  restore:   () => `\x1b8`,
  clearLine: () => `${ESC}2K`,
  clearDown: () => `${ESC}J`,

  // styles
  reset:     '\x1b[0m',
  bold:      '\x1b[1m',
  dim:       '\x1b[2m',
  italic:    '\x1b[3m',
  underline: '\x1b[4m',
  strikethrough: '\x1b[9m',

  // foreground — 256-color
  fg: (n) => `${ESC}38;5;${n}m`,
  bg: (n) => `${ESC}48;5;${n}m`,

  // true color
  rgb:   (r, g, b)       => `${ESC}38;2;${r};${g};${b}m`,
  bgRgb: (r, g, b)       => `${ESC}48;2;${r};${g};${b}m`,
};

// ─── Environment detection ────────────────────────────────────────────────

export function isTTY() {
  return Boolean(process.stdout.isTTY);
}

/**
 * Determine the supported color level of the terminal.
 * Returns: 0 (none), 1 (16 colors), 2 (256 colors), 3 (truecolor)
 * Respects NO_COLOR (https://no-color.org/) and FORCE_COLOR.
 */
export function colorLevel() {
  // NO_COLOR takes precedence — any defined value disables color
  if ('NO_COLOR' in process.env) return 0;

  // FORCE_COLOR overrides TTY detection
  if ('FORCE_COLOR' in process.env) {
    const val = process.env.FORCE_COLOR;
    if (val === '0' || val === 'false') return 0;
    if (val === '1') return 1;
    if (val === '2') return 2;
    if (val === '3') return 3;
    return 3; // FORCE_COLOR with no value or truthy → truecolor
  }

  if (!isTTY()) return 0;

  const term = process.env.TERM || '';
  const colorterm = process.env.COLORTERM || '';

  if (colorterm === 'truecolor' || colorterm === '24bit') return 3;
  if (term.endsWith('-256color') || term === 'xterm-256color') return 2;
  if (term === 'dumb') return 0;

  // Most modern terminals support truecolor
  return 3;
}

// ─── lumi palette ───────────────────────────────────────────────────────

function buildPalette() {
  const level = colorLevel();
  const noop = '';

  if (level === 0) {
    // No color — return empty strings for all palette entries
    return {
      ink: noop, carbon: noop, graphite: noop, slate: noop,
      mist: noop, fog: noop, chalk: noop, white: noop,
      signal: noop, amber: noop, sage: noop, azure: noop, lavender: noop,
      bgInk: noop, bgCarbon: noop, bgGraphite: noop,
      bgSignal: noop, bgSage: noop, bgAmber: noop, bgAzure: noop,
      r: noop, b: noop, d: noop,
    };
  }

  return {
    // neutrals
    ink:       ansi.rgb(14, 14, 16),
    carbon:    ansi.rgb(28, 28, 32),
    graphite:  ansi.rgb(52, 52, 60),
    slate:     ansi.rgb(90, 90, 105),
    mist:      ansi.rgb(150, 150, 165),
    fog:       ansi.rgb(200, 200, 210),
    chalk:     ansi.rgb(235, 235, 240),
    white:     ansi.rgb(248, 248, 252),

    // signal colors
    signal:    ansi.rgb(255, 80, 60),
    amber:     ansi.rgb(255, 185, 40),
    sage:      ansi.rgb(80, 200, 140),
    azure:     ansi.rgb(60, 160, 255),
    lavender:  ansi.rgb(180, 140, 255),

    // backgrounds
    bgInk:     ansi.bgRgb(14, 14, 16),
    bgCarbon:  ansi.bgRgb(28, 28, 32),
    bgGraphite:ansi.bgRgb(52, 52, 60),
    bgSignal:  ansi.bgRgb(255, 80, 60),
    bgSage:    ansi.bgRgb(80, 200, 140),
    bgAmber:   ansi.bgRgb(255, 185, 40),
    bgAzure:   ansi.bgRgb(60, 160, 255),

    r: ansi.reset,
    b: ansi.bold,
    d: ansi.dim,
  };
}

export const c = buildPalette();

// ─── Shared color theme factory ───────────────────────────────────────────
// Used by spinners, progress, banner, box, table — one definition, no duplication.

export function getColorTheme(name) {
  const themes = {
    default:  (f) => `${c.chalk}${f}${c.r}`,
    chalk:    (f) => `${c.chalk}${f}${c.r}`,
    signal:   (f) => `${c.signal}${c.b}${f}${c.r}`,
    sage:     (f) => `${c.sage}${f}${c.r}`,
    azure:    (f) => `${c.azure}${f}${c.r}`,
    amber:    (f) => `${c.amber}${f}${c.r}`,
    lavender: (f) => `${c.lavender}${f}${c.r}`,
    dim:      (f) => `${c.slate}${f}${c.r}`,
  };
  return themes[name] || themes.default;
}

// ─── Output helpers ───────────────────────────────────────────────────────

export function write(str) {
  process.stdout.write(str);
}

export function writeln(str = '') {
  process.stdout.write(str + '\n');
}

export function cols() {
  return process.stdout.columns || 80;
}

export function rows() {
  return process.stdout.rows || 24;
}

// ─── ANSI stripping & measurement ─────────────────────────────────────────

// Handles standard SGR, OSC, CSI, and cursor sequences
const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[78]|\x1b\[[\?]?[0-9;]*[hlJK]/g;

export function stripAnsi(str) {
  return str.replace(ANSI_RE, '');
}

export function visibleLen(str) {
  return stripAnsi(str).length;
}

export function padEnd(str, width, char = ' ') {
  const vl = visibleLen(str);
  if (vl >= width) return str;
  return str + char.repeat(width - vl);
}

/**
 * Truncate a string to `width` visible characters, appending `…` if truncated.
 * Preserves ANSI codes — only visible characters count toward the limit.
 */
export function truncate(str, width) {
  if (width <= 0) return '';
  const stripped = stripAnsi(str);
  if (stripped.length <= width) return str;

  // Walk the original string, counting only visible characters
  let visible = 0;
  let result = '';
  let i = 0;
  while (i < str.length && visible < width - 1) {
    // Check for ANSI escape sequence
    if (str[i] === '\x1b') {
      const match = str.slice(i).match(/^(\x1b\[[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07|\x1b[78]|\x1b\[[\?]?[0-9;]*[hlJK])/);
      if (match) {
        result += match[0];
        i += match[0].length;
        continue;
      }
    }
    result += str[i];
    visible++;
    i++;
  }
  return result + '…' + c.r;
}
