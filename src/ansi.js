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

// ─── Lumina palette — Bauhaus-inspired ────────────────────────────────────
export const c = {
  // neutrals (the soul of the palette)
  ink:       ansi.rgb(14, 14, 16),
  carbon:    ansi.rgb(28, 28, 32),
  graphite:  ansi.rgb(52, 52, 60),
  slate:     ansi.rgb(90, 90, 105),
  mist:      ansi.rgb(150, 150, 165),
  fog:       ansi.rgb(200, 200, 210),
  chalk:     ansi.rgb(235, 235, 240),
  white:     ansi.rgb(248, 248, 252),

  // signal colors — singular, bold, purposeful
  signal:    ansi.rgb(255, 80, 60),    // Bauhaus red
  amber:     ansi.rgb(255, 185, 40),   // warning amber
  sage:      ansi.rgb(80, 200, 140),   // success green
  azure:     ansi.rgb(60, 160, 255),   // info blue
  lavender:  ansi.rgb(180, 140, 255),  // accent

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

// pad / truncate to exact width (accounts for ANSI codes being invisible)
export function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m|\x1b[78]/g, '');
}

export function visibleLen(str) {
  return stripAnsi(str).length;
}

export function padEnd(str, width, char = ' ') {
  const vl = visibleLen(str);
  if (vl >= width) return str;
  return str + char.repeat(width - vl);
}
