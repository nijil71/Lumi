// ─── ANSI escape utilities — zero dependencies ────────────────────────────

export const ESC = '\x1b[';

// Cursor-move with n=0 is a common caller mistake that terminals treat as n=1.
// Emit nothing for n<=0 so "move zero" is truly a no-op.
const move = (ch) => (n = 1) => n > 0 ? `${ESC}${n}${ch}` : '';

export const ansi = {
  // cursor
  up:        move('A'),
  down:      move('B'),
  right:     move('C'),
  left:      move('D'),
  col:       (n = 1) => `${ESC}${n}G`,
  pos:       (r, c)  => `${ESC}${r};${c}H`,
  hide:      () => `${ESC}?25l`,
  show:      () => `${ESC}?25h`,
  save:      () => `\x1b7`,
  restore:   () => `\x1b8`,
  // clearLine implicitly returns cursor to col 1 so callers don't need to
  // pair it with col(1) (and don't leak stale glyphs if they forget).
  clearLine: () => `${ESC}2K${ESC}1G`,
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

  // OSC 8 clickable hyperlinks — supported in iTerm2, WezTerm, Windows Terminal, Kitty, GNOME Terminal 3.26+
  // Falls back to plain visible text in unsupported terminals (escape sequences are silently ignored).
  link:  (text, url)     => `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`,
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
  // Explicit 256-color markers
  if (term.endsWith('-256color') || term === 'xterm-256color') return 2;
  if (term === 'dumb') return 0;
  // Known truecolor terminal programs
  if (process.env.TERM_PROGRAM === 'iTerm.app' ||
      process.env.TERM_PROGRAM === 'WezTerm' ||
      process.env.TERM_PROGRAM === 'vscode') return 3;
  // Conservative default: plain xterm / unknown → 256 colors rather than
  // guessing truecolor (many CI environments set TERM=xterm but don't support
  // truecolor; emitting 38;2;r;g;b codes then produces uncolored output).
  if (term) return 2;
  return 1;
}

// ─── lumi palette ───────────────────────────────────────────────────────
//
// 256-color approximations for each truecolor entry. Terminals that don't
// understand `38;2;r;g;b` silently drop it; we need a real fallback at
// level 2. Values computed via the xterm 6x6x6 cube + greyscale ramp.

function rgbAt(level, r, g, b) {
  if (level >= 3) return ansi.rgb(r, g, b);
  if (level === 2) return ansi.fg(rgbTo256(r, g, b));
  if (level === 1) return `${ESC}${rgbTo16(r, g, b)}m`;
  return '';
}
function bgRgbAt(level, r, g, b) {
  if (level >= 3) return ansi.bgRgb(r, g, b);
  if (level === 2) return ansi.bg(rgbTo256(r, g, b));
  if (level === 1) return `${ESC}${rgbTo16(r, g, b) + 10}m`;
  return '';
}

/** xterm 256-color mapping (6x6x6 cube + grayscale ramp) */
function rgbTo256(r, g, b) {
  // Greyscale: if r≈g≈b, use the 24-step ramp (232..255)
  if (Math.abs(r - g) < 8 && Math.abs(g - b) < 8) {
    if (r < 8)  return 16;
    if (r > 248) return 231;
    return Math.round((r - 8) / 247 * 24) + 232;
  }
  // 6x6x6 cube (16..231)
  const toCube = (v) => v < 48 ? 0 : v < 115 ? 1 : Math.floor((v - 35) / 40);
  return 16 + 36 * toCube(r) + 6 * toCube(g) + toCube(b);
}

/** crude 16-color (ANSI) mapping for ancient terminals */
function rgbTo16(r, g, b) {
  const bright = (r + g + b) / 3 > 128 ? 60 : 0;
  const rBit = r > 90 ? 1 : 0;
  const gBit = g > 90 ? 2 : 0;
  const bBit = b > 90 ? 4 : 0;
  return 30 + rBit + gBit + bBit + bright;
}

function buildPalette(level = colorLevel()) {
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
    ink:       rgbAt(level, 14, 14, 16),
    carbon:    rgbAt(level, 28, 28, 32),
    graphite:  rgbAt(level, 52, 52, 60),
    slate:     rgbAt(level, 90, 90, 105),
    mist:      rgbAt(level, 150, 150, 165),
    fog:       rgbAt(level, 200, 200, 210),
    chalk:     rgbAt(level, 235, 235, 240),
    white:     rgbAt(level, 248, 248, 252),

    // signal colors
    signal:    rgbAt(level, 255, 80, 60),
    amber:     rgbAt(level, 255, 185, 40),
    sage:      rgbAt(level, 80, 200, 140),
    azure:     rgbAt(level, 60, 160, 255),
    lavender:  rgbAt(level, 180, 140, 255),

    // backgrounds
    bgInk:     bgRgbAt(level, 14, 14, 16),
    bgCarbon:  bgRgbAt(level, 28, 28, 32),
    bgGraphite:bgRgbAt(level, 52, 52, 60),
    bgSignal:  bgRgbAt(level, 255, 80, 60),
    bgSage:    bgRgbAt(level, 80, 200, 140),
    bgAmber:   bgRgbAt(level, 255, 185, 40),
    bgAzure:   bgRgbAt(level, 60, 160, 255),

    r: ansi.reset,
    b: ansi.bold,
    d: ansi.dim,
  };
}

// `c` is a proxy over the underlying palette so FORCE_COLOR / NO_COLOR can be
// toggled between imports (useful in tests) via refreshPalette().
let _palette = buildPalette();
export const c = new Proxy({}, {
  get(_t, key) { return _palette[key]; },
  has(_t, key) { return key in _palette; },
  ownKeys()    { return Reflect.ownKeys(_palette); },
  getOwnPropertyDescriptor(_t, key) {
    if (!(key in _palette)) return undefined;
    return { enumerable: true, configurable: true, value: _palette[key] };
  },
});

/** Rebuild the palette — call after changing NO_COLOR / FORCE_COLOR. */
export function refreshPalette() {
  _palette = buildPalette();
  return _palette;
}

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

// ─── Unified exit cleanup registry ────────────────────────────────────────
//
// Every module that hides the cursor, enters an alt-screen, or holds a
// render loop registers a teardown fn here. The single SIGINT/exit handler
// below runs them all, so no matter which modules are active the cursor
// comes back and the screen is sane.

const _cleanups = new Set();
let _exitBound = false;

function _runCleanups() {
  for (const fn of _cleanups) {
    try { fn(); } catch { /* swallow — cleanup is best-effort */ }
  }
  _cleanups.clear();
  if (isTTY()) write(ansi.show());
}

function _ensureExitHandler() {
  if (_exitBound) return;
  _exitBound = true;
  process.on('SIGINT', () => {
    _runCleanups();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    _runCleanups();
    process.exit(143);
  });
  // exit covers normal termination and `process.exit()` from user code
  process.on('exit', _runCleanups);
}

/** Register a cleanup. Returns an unregister fn. */
export function registerCleanup(fn) {
  _ensureExitHandler();
  _cleanups.add(fn);
  return () => _cleanups.delete(fn);
}

// ─── Gradient text ────────────────────────────────────────────────────────

/**
 * Apply a left-to-right RGB gradient to a string.
 * Falls back to plain text when color level < 3 (no truecolor).
 *
 * @param {string} text - Input text (ANSI codes are stripped before colorizing)
 * @param {[number,number,number]} fromRGB - Start color as [r, g, b]
 * @param {[number,number,number]} toRGB   - End color as [r, g, b]
 * @returns {string} Gradient-colored string with reset at end
 */
export function gradient(text, fromRGB, toRGB) {
  if (colorLevel() < 3) return text;
  const chars = [...stripAnsi(text)];
  const len = chars.length;
  if (len === 0) return text;

  let result = '';
  for (let i = 0; i < len; i++) {
    const t = len === 1 ? 0 : i / (len - 1);
    const r = Math.round(fromRGB[0] + (toRGB[0] - fromRGB[0]) * t);
    const g = Math.round(fromRGB[1] + (toRGB[1] - fromRGB[1]) * t);
    const b = Math.round(fromRGB[2] + (toRGB[2] - fromRGB[2]) * t);
    result += ansi.rgb(r, g, b) + chars[i];
  }
  return result + ansi.reset;
}

/**
 * Preset gradient pairs — pass as [fromRGB, toRGB] to gradient().
 *
 * @example
 * writeln(gradient('Hello', ...GRADIENTS.neon));
 */
export const GRADIENTS = {
  neon:    [[108, 71,  255], [0,   201, 167]],  // purple → teal
  fire:    [[255, 71,  87],  [255, 185, 40 ]],  // red → amber
  ice:     [[60,  160, 255], [155, 235, 255]],  // blue → sky
  sunset:  [[255, 71,  87],  [180, 100, 255]],  // red → lavender
  matrix:  [[0,   100, 40 ], [0,   210, 90 ]],  // deep green → bright green
  gold:    [[255, 200, 0  ], [255, 130, 40 ]],  // gold → orange
  dawn:    [[255, 120, 180], [255, 185, 40 ]],  // pink → amber
  ocean:   [[0,   180, 255], [0,   120, 180]],  // sky → deep blue
};

// ─── ANSI stripping & measurement ─────────────────────────────────────────

// Matches SGR, OSC (including 8-hyperlink), cursor save/restore, and misc CSI.
const ANSI_STRIP_RE = /\x1b\][^\x07]*\x07|\x1b\[[\?!]?[0-9;]*[a-zA-Z~]|\x1b[78]/g;

export function stripAnsi(str) {
  return String(str).replace(ANSI_STRIP_RE, '');
}

// ─── East-Asian / emoji width ─────────────────────────────────────────────
//
// Minimal width detection: returns 2 for CJK ideographs, full-width forms,
// emoji, and related ranges; 0 for combining marks and zero-width joiners;
// 1 for everything else. Covers the ranges that actually break terminal
// layout without shipping a 40KB unicode table.

const WIDE_RANGES = [
  [0x1100, 0x115F],   // Hangul Jamo
  [0x2329, 0x232A],
  [0x2E80, 0x303E], [0x3041, 0x33FF], [0x3400, 0x4DBF], [0x4E00, 0x9FFF],
  [0xA000, 0xA4CF],
  [0xAC00, 0xD7A3],   // Hangul syllables
  [0xF900, 0xFAFF],   // CJK compat
  [0xFE30, 0xFE4F],   // CJK compat forms
  [0xFF00, 0xFF60], [0xFFE0, 0xFFE6],  // Fullwidth
  [0x1F300, 0x1F64F], // Misc symbols & pictographs + emoticons
  [0x1F680, 0x1F6FF], // Transport & map
  [0x1F700, 0x1F77F],
  [0x1F780, 0x1F7FF],
  [0x1F800, 0x1F8FF],
  [0x1F900, 0x1F9FF], // Supplemental symbols (incl. common emoji)
  [0x1FA00, 0x1FA6F],
  [0x1FA70, 0x1FAFF],
  [0x20000, 0x2FFFD], // CJK Ext B-F
  [0x30000, 0x3FFFD],
];

const ZERO_WIDTH_RANGES = [
  [0x0300, 0x036F],   // combining diacriticals
  [0x200B, 0x200F],   // zero-width space / joiner / LRM/RLM
  [0x202A, 0x202E],   // bidi controls
  [0x2060, 0x206F],
  [0xFE00, 0xFE0F],   // variation selectors
  [0xFEFF, 0xFEFF],   // BOM
];

function inRanges(cp, ranges) {
  for (let i = 0; i < ranges.length; i++) {
    if (cp >= ranges[i][0] && cp <= ranges[i][1]) return true;
  }
  return false;
}

/** Terminal column width of a single code point. */
export function charWidth(cp) {
  if (cp == null) return 0;
  if (cp < 0x20 || (cp >= 0x7F && cp < 0xA0)) return 0;  // control chars
  if (inRanges(cp, ZERO_WIDTH_RANGES)) return 0;
  if (inRanges(cp, WIDE_RANGES)) return 2;
  return 1;
}

/**
 * Visible column width of a string (ANSI stripped, CJK/emoji counted as 2).
 * Handles ZWJ sequences as a single visible glyph on the terminal.
 */
export function visibleLen(str) {
  const s = stripAnsi(str);
  let width = 0;
  let prevZwj = false;
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    // ZWJ — next char is joined to the previous glyph, so it doesn't add width
    if (cp === 0x200D) { prevZwj = true; continue; }
    if (prevZwj) { prevZwj = false; continue; }
    width += charWidth(cp);
  }
  return width;
}

export function padEnd(str, width, char = ' ') {
  const vl = visibleLen(str);
  if (vl >= width) return str;
  return str + char.repeat(width - vl);
}

/**
 * Truncate a string to `width` visible columns, appending `…` if truncated.
 * Preserves ANSI codes — only visible characters count toward the limit.
 * Handles wide chars (CJK/emoji count as 2 columns) and re-emits a reset
 * only when ANSI styling was actually applied.
 */
export function truncate(str, width) {
  if (width <= 0) return '';
  if (visibleLen(str) <= width) return String(str);

  let visible = 0;
  let result = '';
  let sawAnsi = false;
  let i = 0;
  const s = String(str);

  while (i < s.length) {
    // ANSI escape sequence — copy through without counting width
    if (s[i] === '\x1b') {
      const tail = s.slice(i);
      const m = tail.match(/^\x1b\][^\x07]*\x07|^\x1b\[[\?!]?[0-9;]*[a-zA-Z~]|^\x1b[78]/);
      if (m) {
        result += m[0];
        i += m[0].length;
        sawAnsi = true;
        continue;
      }
    }

    // Consume one code point (may be 2 UTF-16 units for astral chars)
    const cp = s.codePointAt(i);
    const ch = String.fromCodePoint(cp);
    const w = charWidth(cp);

    // Stop before adding a glyph that would push us over width-1
    // (leaving room for the ellipsis).
    if (visible + w > width - 1) break;

    result += ch;
    visible += w;
    i += ch.length;
  }

  return result + '…' + (sawAnsi ? ansi.reset : '');
}
