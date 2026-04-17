// ─── lumi-cli / banner ──────────────────────────────────────────────────
// Custom 5-row block letterforms — original glyph design

import { writeln, c as colors, cols, getColorTheme, gradient, colorLevel } from '../ansi.js';

// Each char: 5 rows of 5 chars each (monospaced block font)
const GLYPHS = {
  'A': ['  █  ','  █  ',' █ █ ','█████','█   █'],
  'B': ['████ ','█   █','████ ','█   █','████ '],
  'C': [' ███ ','█    ','█    ','█    ',' ███ '],
  'D': ['████ ','█   █','█   █','█   █','████ '],
  'E': ['█████','█    ','████ ','█    ','█████'],
  'F': ['█████','█    ','████ ','█    ','█    '],
  'G': [' ███ ','█    ','█  ██','█   █',' ███ '],
  'H': ['█   █','█   █','█████','█   █','█   █'],
  'I': ['███  ',' █   ',' █   ',' █   ','███  '],
  'J': ['  ███','   █ ','   █ ','█  █ ',' ██  '],
  'K': ['█  █ ','█ █  ','██   ','█ █  ','█  █ '],
  'L': ['█    ','█    ','█    ','█    ','█████'],
  'M': ['█   █','██ ██','█ █ █','█   █','█   █'],
  'N': ['█   █','██  █','█ █ █','█  ██','█   █'],
  'O': [' ███ ','█   █','█   █','█   █',' ███ '],
  'P': ['████ ','█   █','████ ','█    ','█    '],
  'Q': [' ███ ','█   █','█   █','█  ██',' ████'],
  'R': ['████ ','█   █','████ ','█ █  ','█  █ '],
  'S': [' ████','█    ',' ██  ','   █ ','████ '],
  'T': ['█████',' █   ',' █   ',' █   ',' █   '],
  'U': ['█   █','█   █','█   █','█   █',' ███ '],
  'V': ['█   █','█   █','█   █',' █ █ ','  █  '],
  'W': ['█   █','█   █','█ █ █','██ ██','█   █'],
  'X': ['█   █',' █ █ ','  █  ',' █ █ ','█   █'],
  'Y': ['█   █',' █ █ ','  █  ','  █  ','  █  '],
  'Z': ['█████','   █ ','  █  ',' █   ','█████'],
  '0': [' ███ ','█  ██','█ █ █','██  █',' ███ '],
  '1': [' ██  ',' █   ',' █   ',' █   ','███  '],
  '2': [' ███ ','█   █','  ██ ',' █   ','█████'],
  '3': ['████ ','    █','███  ','    █','████ '],
  '4': ['█  █ ','█  █ ','█████','   █ ','   █ '],
  '5': ['█████','█    ','████ ','    █','████ '],
  '6': [' ███ ','█    ','████ ','█   █',' ███ '],
  '7': ['█████','   █ ','  █  ',' █   ','█    '],
  '8': [' ███ ','█   █',' ███ ','█   █',' ███ '],
  '9': [' ███ ','█   █',' ████','    █',' ███ '],
  ' ': ['     ','     ','     ','     ','     '],
  '-': ['     ','     ','████ ','     ','     '],
  '.': ['     ','     ','     ','     ','  █  '],
  '!': ['  █  ','  █  ','  █  ','     ','  █  '],
  '_': ['     ','     ','     ','     ','█████'],
};

export function banner(text, options = {}) {
  const upper  = text.toUpperCase();
  const colorFn = getColorTheme(options.color || 'chalk');
  const char   = options.char   || '█';
  const gap    = options.gap    || 1;
  const align  = options.align  || 'left';
  const pad    = options.pad    || 2;

  const glyphs = [...upper].map(ch => GLYPHS[ch] || GLYPHS[' ']);
  const rowCount = 5;
  const width  = cols();

  // Build rows without the leading pad — we'll add indent below based on
  // the alignment mode so right-align math doesn't double-count it.
  const lines = [];
  for (let row = 0; row < rowCount; row++) {
    let line = '';
    for (let gi = 0; gi < glyphs.length; gi++) {
      const g = glyphs[gi];
      const rowStr = g[row].replace(/█/g, char);
      line += rowStr;
      if (gi < glyphs.length - 1) line += ' '.repeat(gap);
    }
    lines.push(line);
  }

  const rawLen = lines[0].length;
  const offset = align === 'center'
    ? Math.max(0, Math.floor((width - rawLen) / 2))
    : align === 'right'
      ? Math.max(pad, width - rawLen - pad)
      : pad;

  const indent = ' '.repeat(offset);

  writeln();
  if (options.gradient && colorLevel() >= 3) {
    const [fromRGB, toRGB] = options.gradient;
    for (const line of lines) {
      writeln(indent + gradient(line, fromRGB, toRGB));
    }
  } else {
    for (const line of lines) {
      writeln(colorFn(indent + line));
    }
  }
  writeln();
}

// ─── Divider ──────────────────────────────────────────────────────────────

export function divider(options = {}) {
  const w     = options.width || cols();
  const char  = options.char  || '─';
  const label = options.label || null;
  const colorFn = getColorTheme(options.color || 'dim');

  if (!label) {
    writeln(colorFn(char.repeat(w)));
    return;
  }

  const labelStr  = ` ${label} `;
  const sideLen   = Math.floor((w - labelStr.length) / 2);
  const left      = char.repeat(sideLen);
  const right     = char.repeat(w - sideLen - labelStr.length);
  writeln(colorFn(left) + `${colors.mist}${labelStr}${colors.r}` + colorFn(right));
}

// ─── Section header ───────────────────────────────────────────────────────

export function header(title, subtitle = '', options = {}) {
  const w    = options.width || cols();
  const colorFn = getColorTheme(options.color || 'chalk');

  writeln();
  writeln(colorFn(`${colors.b}${title}${colors.r}`));
  if (subtitle) writeln(`${colors.slate}${subtitle}${colors.r}`);
  writeln(`${colors.graphite}${'─'.repeat(Math.min(w, 60))}${colors.r}`);
  writeln();
}

// ─── Badge ────────────────────────────────────────────────────────────────

export function badge(text, options = {}) {
  const type = options.type || 'default';
  const styles = {
    default: { bg: colors.bgGraphite, fg: colors.chalk },
    success: { bg: colors.bgSage,     fg: colors.ink },
    error:   { bg: colors.bgSignal,   fg: colors.white },
    warning: { bg: colors.bgAmber,    fg: colors.ink },
    info:    { bg: colors.bgAzure,    fg: colors.ink },
  };
  const s = styles[type] || styles.default;
  return `${s.bg}${s.fg}${colors.b} ${text} ${colors.r}`;
}
