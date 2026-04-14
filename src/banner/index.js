// ─── lumina-cli / banner ──────────────────────────────────────────────────
// Handcrafted 5-row block letterforms — original design, not figlet

import { writeln, c as colors, cols, ansi } from '../ansi.js';

// Each char: 5 rows of 5 chars each (monospaced block font)
// Blank space where nothing should render
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

const COLORS = {
  chalk:    (s) => `${colors.chalk}${s}${colors.r}`,
  signal:   (s) => `${colors.signal}${colors.b}${s}${colors.r}`,
  sage:     (s) => `${colors.sage}${s}${colors.r}`,
  azure:    (s) => `${colors.azure}${s}${colors.r}`,
  amber:    (s) => `${colors.amber}${s}${colors.r}`,
  lavender: (s) => `${colors.lavender}${s}${colors.r}`,
  dim:      (s) => `${colors.graphite}${s}${colors.r}`,
};

export function banner(text, options = {}) {
  const upper  = text.toUpperCase();
  const color  = COLORS[options.color || 'chalk'];
  const char   = options.char   || '█';
  const gap    = options.gap    || 1;  // spaces between chars
  const align  = options.align  || 'left';
  const pad    = options.pad    || 2;

  const glyphs = [...upper].map(ch => GLYPHS[ch] || GLYPHS[' ']);
  const rows   = 5;
  const width  = cols();

  // Build each row
  const lines = [];
  for (let row = 0; row < rows; row++) {
    let line = ' '.repeat(pad);
    for (let gi = 0; gi < glyphs.length; gi++) {
      const g = glyphs[gi];
      const rowStr = g[row].replace(/█/g, char);
      line += rowStr;
      if (gi < glyphs.length - 1) line += ' '.repeat(gap);
    }
    lines.push(line);
  }

  // Align
  const rawLen = lines[0].length;
  const offset = align === 'center'
    ? Math.max(0, Math.floor((width - rawLen) / 2))
    : align === 'right'
      ? Math.max(0, width - rawLen - pad)
      : 0;

  const indent = ' '.repeat(offset);

  writeln();
  for (const line of lines) {
    writeln(color(indent + line));
  }
  writeln();
}

// ─── Divider ──────────────────────────────────────────────────────────────

export function divider(options = {}) {
  const w     = options.width || cols();
  const char  = options.char  || '─';
  const label = options.label || null;
  const col   = COLORS[options.color || 'dim'];

  if (!label) {
    writeln(col(char.repeat(w)));
    return;
  }

  const labelStr  = ` ${label} `;
  const sideLen   = Math.floor((w - labelStr.length) / 2);
  const left      = char.repeat(sideLen);
  const right     = char.repeat(w - sideLen - labelStr.length);
  writeln(col(left) + `${colors.mist}${labelStr}${colors.r}` + col(right));
}

// ─── Section header ───────────────────────────────────────────────────────

export function header(title, subtitle = '', options = {}) {
  const w    = options.width || cols();
  const col  = COLORS[options.color || 'chalk'];

  writeln();
  writeln(col(`${colors.b}${title}${colors.r}`));
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
