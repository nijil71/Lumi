// ─── lumi-cli / box ─────────────────────────────────────────────────────

import { writeln, c as colors, cols, padEnd, visibleLen, stripAnsi, getColorTheme } from '../ansi.js';

// ─── Border styles ────────────────────────────────────────────────────────

const BORDERS = {
  single: {
    tl: '┌', tr: '┐', bl: '└', br: '┘',
    h:  '─', v:  '│',
    ml: '├', mr: '┤',
  },
  double: {
    tl: '╔', tr: '╗', bl: '╚', br: '╝',
    h:  '═', v:  '║',
    ml: '╠', mr: '╣',
  },
  rounded: {
    tl: '╭', tr: '╮', bl: '╰', br: '╯',
    h:  '─', v:  '│',
    ml: '├', mr: '┤',
  },
  thick: {
    tl: '┏', tr: '┓', bl: '┗', br: '┛',
    h:  '━', v:  '┃',
    ml: '┣', mr: '┫',
  },
  dashed: {
    tl: '┌', tr: '┐', bl: '└', br: '┘',
    h:  '╌', v:  '╎',
    ml: '├', mr: '┤',
  },
  ascii: {
    tl: '+', tr: '+', bl: '+', br: '+',
    h:  '-', v:  '|',
    ml: '+', mr: '+',
  },
};

// ─── Box ──────────────────────────────────────────────────────────────────

export function box(content, options = {}) {
  const border     = BORDERS[options.border || 'single'];
  const colorFn    = getColorTheme(options.color || 'default');
  const title      = options.title  || null;
  const footer     = options.footer || null;
  const padding    = options.padding !== undefined ? options.padding : 1;
  const maxWidth   = options.width  || Math.min(cols(), 80);
  const align      = options.align  || 'left';
  const innerWidth = maxWidth - 2 - padding * 2;

  const lines = typeof content === 'string'
    ? content.split('\n')
    : content;

  // ANSI-aware word wrapping: preserves ANSI codes during wrapping
  const wrapped = [];
  for (const line of lines) {
    const vLen = visibleLen(line);
    if (vLen <= innerWidth) {
      wrapped.push(line);
    } else {
      // For lines with ANSI codes, we need to track active codes
      // Simple approach: strip, wrap, re-apply per-line styling
      const stripped = stripAnsi(line);
      const words = stripped.split(' ');
      let current = '';
      for (const word of words) {
        const test = current ? current + ' ' + word : word;
        if (test.length > innerWidth && current) {
          wrapped.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) wrapped.push(current);
    }
  }

  const w = maxWidth;
  const pad = ' '.repeat(padding);

  // Align content within inner width
  function alignLine(line, iw) {
    const vl = visibleLen(line);
    const spaces = Math.max(0, iw - vl);
    if (align === 'center') {
      const left = Math.floor(spaces / 2);
      const right = spaces - left;
      return ' '.repeat(left) + line + ' '.repeat(right);
    }
    if (align === 'right') {
      return ' '.repeat(spaces) + line;
    }
    // left (default)
    return line + ' '.repeat(spaces);
  }

  const indentStr = options.indent || '';

  // Top border
  if (title) {
    const t = ` ${title} `;
    const sideLen = Math.floor((w - 2 - t.length) / 2);
    const r = w - 2 - sideLen - t.length;
    writeln(
      indentStr +
      colorFn(border.tl + border.h.repeat(sideLen)) +
      `${colors.chalk}${colors.b}${t}${colors.r}` +
      colorFn(border.h.repeat(r) + border.tr)
    );
  } else {
    writeln(indentStr + colorFn(border.tl + border.h.repeat(w - 2) + border.tr));
  }

  // Padding top
  for (let i = 0; i < Math.floor(padding / 2); i++) {
    writeln(indentStr + colorFn(border.v) + ' '.repeat(w - 2) + colorFn(border.v));
  }

  // Content lines
  for (const line of wrapped) {
    const aligned = alignLine(line, innerWidth);
    writeln(
      indentStr +
      colorFn(border.v) +
      pad + aligned + pad +
      colorFn(border.v)
    );
  }

  // Padding bottom
  for (let i = 0; i < Math.floor(padding / 2); i++) {
    writeln(indentStr + colorFn(border.v) + ' '.repeat(w - 2) + colorFn(border.v));
  }

  // Footer divider
  if (footer) {
    writeln(indentStr + colorFn(border.ml + border.h.repeat(w - 2) + border.mr));
    const spaces = Math.max(0, innerWidth - stripAnsi(footer).length);
    writeln(
      indentStr +
      colorFn(border.v) +
      pad + `${colors.slate}${footer}${colors.r}` + ' '.repeat(spaces) + pad +
      colorFn(border.v)
    );
  }

  // Bottom border
  writeln(indentStr + colorFn(border.bl + border.h.repeat(w - 2) + border.br));
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
