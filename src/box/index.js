// ─── lumi-cli / box ─────────────────────────────────────────────────────

import { writeln, c as colors, cols, padEnd, visibleLen, stripAnsi, truncate, getColorTheme } from '../ansi.js';

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

// ─── ANSI-aware word wrap ─────────────────────────────────────────────────
//
// Splits `line` into pieces each having visible width ≤ innerWidth, while
// preserving ANSI SGR codes across wrap boundaries. If a code opens on one
// wrapped segment, we close it (reset) at end-of-segment and re-open at
// start of next segment. This keeps color/bold/etc. from bleeding past the
// right border and from getting lost on the continuation line.

function wrapLine(line, innerWidth) {
  if (visibleLen(line) <= innerWidth) return [line];

  // Tokenize into {type:'ansi'|'text', value} chunks.
  const tokens = [];
  const re = /\x1b\[[\?!]?[0-9;]*[a-zA-Z~]|\x1b\][^\x07]*\x07|\x1b[78]/g;
  let last = 0, m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) tokens.push({ type: 'text', value: line.slice(last, m.index) });
    tokens.push({ type: 'ansi', value: m[0] });
    last = re.lastIndex;
  }
  if (last < line.length) tokens.push({ type: 'text', value: line.slice(last) });

  // Walk tokens, wrapping on spaces where possible. Track active SGR codes
  // so we can re-emit them on the next line.
  const out = [];
  let current = '';
  let currentVis = 0;
  let active = [];   // stack of currently-open SGR strings

  const pushLine = () => {
    // Close with reset so the right border isn't painted by our color.
    out.push(current + (active.length ? colors.r : ''));
    current = active.join('');
    currentVis = 0;
  };

  for (const tok of tokens) {
    if (tok.type === 'ansi') {
      current += tok.value;
      if (tok.value === colors.r || tok.value === '\x1b[0m') {
        active = [];
      } else {
        active.push(tok.value);
      }
      continue;
    }

    // Split text into words preserving spaces as separators
    const parts = tok.value.split(/(\s+)/);
    for (const part of parts) {
      if (part === '') continue;
      const partVis = visibleLen(part);

      if (currentVis + partVis <= innerWidth) {
        current += part;
        currentVis += partVis;
        continue;
      }

      // part doesn't fit on the current line
      if (/^\s+$/.test(part)) {
        // trailing space at wrap boundary — drop and wrap
        pushLine();
        continue;
      }

      // if current line has content, wrap it
      if (currentVis > 0) pushLine();

      // part alone is longer than innerWidth — hard-break by character
      if (partVis > innerWidth) {
        let remaining = part;
        while (visibleLen(remaining) > innerWidth) {
          const chunk = [...remaining].slice(0, innerWidth).join('');
          current += chunk;
          currentVis += visibleLen(chunk);
          pushLine();
          remaining = [...remaining].slice(innerWidth).join('');
        }
        current += remaining;
        currentVis += visibleLen(remaining);
      } else {
        current += part;
        currentVis += partVis;
      }
    }
  }

  if (currentVis > 0 || current.length > 0) {
    out.push(current + (active.length ? colors.r : ''));
  }
  return out;
}

// ─── Box ──────────────────────────────────────────────────────────────────

export function box(content, options = {}) {
  if (content == null) {
    throw new TypeError('box: content is required (string, string[], or non-null value) — got ' + content);
  }
  const borderName = options.border || 'single';
  const border     = BORDERS[borderName];
  if (!border) {
    throw new RangeError(`box: unknown border "${borderName}" — expected one of ${Object.keys(BORDERS).join(' | ')}`);
  }
  const colorFn    = getColorTheme(options.color || 'default');
  const title      = options.title  || null;
  const footer     = options.footer || null;
  const padding    = options.padding !== undefined ? options.padding : 1;
  const maxWidth   = options.width  || Math.min(cols(), 80);
  const align      = options.align  || 'left';
  const indentStr  = options.indent || '';
  const innerWidth = Math.max(1, maxWidth - 2 - padding * 2);

  const lines = typeof content === 'string'
    ? content.split('\n')
    : content;

  // ANSI-aware word wrapping: preserves ANSI codes across wrap boundaries
  const wrapped = [];
  for (const line of lines) {
    for (const w of wrapLine(line, innerWidth)) wrapped.push(w);
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

  // Top border
  if (title) {
    // Truncate title if it's longer than the available border space
    const titleVis = visibleLen(title);
    const maxTitle = Math.max(0, w - 4);  // 2 for corners + at least 1 h on each side
    const shown = titleVis > maxTitle ? truncate(title, maxTitle) : title;
    const t = ` ${shown} `;
    const tLen = visibleLen(t);
    const sideLen = Math.max(0, Math.floor((w - 2 - tLen) / 2));
    const r = Math.max(0, w - 2 - sideLen - tLen);
    writeln(
      indentStr +
      colorFn(border.tl + border.h.repeat(sideLen)) +
      `${colors.chalk}${colors.b}${t}${colors.r}` +
      colorFn(border.h.repeat(r) + border.tr)
    );
  } else {
    writeln(indentStr + colorFn(border.tl + border.h.repeat(Math.max(0, w - 2)) + border.tr));
  }

  // Padding top (full padding rows, not halved)
  for (let i = 0; i < padding; i++) {
    writeln(indentStr + colorFn(border.v) + ' '.repeat(Math.max(0, w - 2)) + colorFn(border.v));
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
  for (let i = 0; i < padding; i++) {
    writeln(indentStr + colorFn(border.v) + ' '.repeat(Math.max(0, w - 2)) + colorFn(border.v));
  }

  // Footer
  if (footer) {
    writeln(indentStr + colorFn(border.ml + border.h.repeat(Math.max(0, w - 2)) + border.mr));
    // Truncate footer if too wide for inner width
    const footerText = visibleLen(footer) > innerWidth ? truncate(footer, innerWidth) : footer;
    const aligned = padEnd(`${colors.slate}${footerText}${colors.r}`, innerWidth);
    writeln(
      indentStr +
      colorFn(border.v) +
      pad + aligned + pad +
      colorFn(border.v)
    );
  }

  // Bottom border
  writeln(indentStr + colorFn(border.bl + border.h.repeat(Math.max(0, w - 2)) + border.br));
}

// ─── Columns layout ───────────────────────────────────────────────────────

export function columns(data, options = {}) {
  const total  = options.width || cols();
  const gap    = options.gap   || 3;
  const n      = data.length;
  if (n === 0) return;
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
