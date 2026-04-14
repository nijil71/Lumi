// ─── lumina-cli / box ─────────────────────────────────────────────────────

import { writeln, write, c as colors, cols, padEnd, visibleLen, stripAnsi, ansi } from '../ansi.js';

// ─── Border styles ────────────────────────────────────────────────────────

const BORDERS = {
  // Thin single line — Swiss precision
  single: {
    tl: '┌', tr: '┐', bl: '└', br: '┘',
    h:  '─', v:  '│',
    ml: '├', mr: '┤',
  },
  // Double — weighty, authoritative
  double: {
    tl: '╔', tr: '╗', bl: '╚', br: '╝',
    h:  '═', v:  '║',
    ml: '╠', mr: '╣',
  },
  // Rounded — softer, contemporary
  rounded: {
    tl: '╭', tr: '╮', bl: '╰', br: '╯',
    h:  '─', v:  '│',
    ml: '├', mr: '┤',
  },
  // Thick — brutalist, bold
  thick: {
    tl: '┏', tr: '┓', bl: '┗', br: '┛',
    h:  '━', v:  '┃',
    ml: '┣', mr: '┫',
  },
  // Dashed — casual, airy
  dashed: {
    tl: '┌', tr: '┐', bl: '└', br: '┘',
    h:  '╌', v:  '╎',
    ml: '├', mr: '┤',
  },
  // ASCII — maximum compatibility
  ascii: {
    tl: '+', tr: '+', bl: '+', br: '+',
    h:  '-', v:  '|',
    ml: '+', mr: '+',
  },
};

const COLORS = {
  default:  (s) => `${colors.graphite}${s}${colors.r}`,
  signal:   (s) => `${colors.signal}${s}${colors.r}`,
  sage:     (s) => `${colors.sage}${s}${colors.r}`,
  azure:    (s) => `${colors.azure}${s}${colors.r}`,
  amber:    (s) => `${colors.amber}${s}${colors.r}`,
  lavender: (s) => `${colors.lavender}${s}${colors.r}`,
  chalk:    (s) => `${colors.chalk}${s}${colors.r}`,
  dim:      (s) => `${colors.slate}${s}${colors.r}`,
};

// ─── Box ──────────────────────────────────────────────────────────────────

export function box(content, options = {}) {
  const border     = BORDERS[options.border || 'single'];
  const colorFn    = COLORS[options.color  || 'default'];
  const title      = options.title  || null;
  const footer     = options.footer || null;
  const padding    = options.padding !== undefined ? options.padding : 1;
  const maxWidth   = options.width  || Math.min(cols(), 80);
  const innerWidth = maxWidth - 2 - padding * 2;

  const lines = typeof content === 'string'
    ? content.split('\n')
    : content;

  // Wrap lines that exceed innerWidth
  const wrapped = [];
  for (const line of lines) {
    const stripped = stripAnsi(line);
    if (stripped.length <= innerWidth) {
      wrapped.push(line);
    } else {
      // Simple wrap
      const words = stripped.split(' ');
      let current = '';
      for (const word of words) {
        if ((current + ' ' + word).trim().length > innerWidth) {
          if (current) wrapped.push(current);
          current = word;
        } else {
          current = (current + ' ' + word).trim();
        }
      }
      if (current) wrapped.push(current);
    }
  }

  const w = maxWidth;
  const pad = ' '.repeat(padding);

  // Top border
  if (title) {
    const t = ` ${title} `;
    const sideLen = Math.floor((w - 2 - t.length) / 2);
    const r = w - 2 - sideLen - t.length;
    writeln(
      colorFn(border.tl + border.h.repeat(sideLen)) +
      `${colors.chalk}${colors.b}${t}${colors.r}` +
      colorFn(border.h.repeat(r) + border.tr)
    );
  } else {
    writeln(colorFn(border.tl + border.h.repeat(w - 2) + border.tr));
  }

  // Padding top
  for (let i = 0; i < Math.floor(padding / 2); i++) {
    writeln(colorFn(border.v) + ' '.repeat(w - 2) + colorFn(border.v));
  }

  // Content lines
  for (const line of wrapped) {
    const visible = visibleLen(line);
    const spaces  = Math.max(0, innerWidth - visible);
    writeln(
      colorFn(border.v) +
      pad + line + ' '.repeat(spaces) + pad +
      colorFn(border.v)
    );
  }

  // Padding bottom
  for (let i = 0; i < Math.floor(padding / 2); i++) {
    writeln(colorFn(border.v) + ' '.repeat(w - 2) + colorFn(border.v));
  }

  // Footer divider
  if (footer) {
    writeln(colorFn(border.ml + border.h.repeat(w - 2) + border.mr));
    const spaces = Math.max(0, innerWidth - stripAnsi(footer).length);
    writeln(
      colorFn(border.v) +
      pad + `${colors.slate}${footer}${colors.r}` + ' '.repeat(spaces) + pad +
      colorFn(border.v)
    );
  }

  // Bottom border
  writeln(colorFn(border.bl + border.h.repeat(w - 2) + border.br));
}

// ─── Columns layout ───────────────────────────────────────────────────────

export function columns(data, options = {}) {
  const total  = options.width || cols();
  const gap    = options.gap   || 3;
  const n      = data.length;
  const colW   = Math.floor((total - gap * (n - 1)) / n);

  const heights = data.map(col =>
    Array.isArray(col.content) ? col.content.length : col.content.split('\n').length
  );
  const maxH = Math.max(...heights);

  const normalized = data.map(col => {
    const lines = Array.isArray(col.content)
      ? col.content
      : col.content.split('\n');
    while (lines.length < maxH) lines.push('');
    return { ...col, lines };
  });

  for (let row = 0; row < maxH; row++) {
    let out = '';
    for (let ci = 0; ci < normalized.length; ci++) {
      const col   = normalized[ci];
      const line  = col.lines[row] || '';
      const vis   = visibleLen(line);
      out += line + ' '.repeat(Math.max(0, colW - vis));
      if (ci < normalized.length - 1) out += ' '.repeat(gap);
    }
    writeln(out);
  }
}
