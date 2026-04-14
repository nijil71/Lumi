// ─── lumina-cli / table ────────────────────────────────────────────────────

import { writeln, c as colors, cols, visibleLen, stripAnsi, truncate, getColorTheme } from '../ansi.js';

const BORDERS = {
  single: { tl:'┌',tr:'┐',bl:'└',br:'┘',h:'─',v:'│',ml:'├',mr:'┤',tm:'┬',bm:'┴',x:'┼' },
  thick:  { tl:'┏',tr:'┓',bl:'┗',br:'┛',h:'━',v:'┃',ml:'┣',mr:'┫',tm:'┳',bm:'┻',x:'╋' },
  double: { tl:'╔',tr:'╗',bl:'╚',br:'╝',h:'═',v:'║',ml:'╠',mr:'╣',tm:'╦',bm:'╩',x:'╬' },
  minimal:{ tl:'',tr:'',bl:'',br:'',h:'─',v:' ',ml:'',mr:'',tm:'',bm:'',x:'' },
};

export function table(data, options = {}) {
  if (!data || data.length === 0) return;

  const border     = BORDERS[options.border || 'single'];
  const colorFn    = getColorTheme(options.color || 'default');
  const headers    = options.headers || Object.keys(data[0]);
  const maxW       = options.width   || cols();
  const alignOpts  = options.align   || {};   // { columnName: 'right' | 'center' | 'left' }
  const maxWidths  = options.maxWidth || {};   // { columnName: number }

  // Compute column widths
  const colWidths = headers.map((h) => {
    const dataMax = Math.max(...data.map(row => {
      const val = row[h] !== undefined ? String(row[h]) : '';
      return visibleLen(val);
    }));
    let w = Math.max(visibleLen(h), dataMax);
    // Apply max width constraint
    if (maxWidths[h] && w > maxWidths[h]) {
      w = maxWidths[h];
    }
    return w;
  });

  // Pad/align a cell value
  function alignCell(str, w, alignment) {
    const s = String(str ?? '');
    // Truncate if exceeding max width
    const vis = visibleLen(s);
    const text = vis > w ? truncate(s, w) : s;
    const vl = visibleLen(text);
    const spaces = Math.max(0, w - vl);

    if (alignment === 'right') {
      return ' '.repeat(spaces) + text;
    }
    if (alignment === 'center') {
      const left = Math.floor(spaces / 2);
      const right = spaces - left;
      return ' '.repeat(left) + text + ' '.repeat(right);
    }
    // left (default)
    return text + ' '.repeat(spaces);
  }

  const v = border.v;

  // Header color
  const hdrColor = (s) => `${colors.chalk}${colors.b}${s}${colors.r}`;

  // ── Top border ──
  if (border.tl) {
    const line = border.tl +
      colWidths.map(w => border.h.repeat(w + 2)).join(border.tm) +
      border.tr;
    writeln(colorFn(line));
  }

  // ── Header ──
  const hdrCells = headers.map((h, i) => {
    const aligned = alignCell(h, colWidths[i], alignOpts[h] || 'left');
    return ` ${hdrColor(aligned)} `;
  });
  writeln(colorFn(v) + hdrCells.join(colorFn(v)) + colorFn(v));

  // ── Header divider ──
  if (border.ml) {
    const line = border.ml +
      colWidths.map(w => border.h.repeat(w + 2)).join(border.x) +
      border.mr;
    writeln(colorFn(line));
  } else {
    writeln(colorFn(border.h.repeat(colWidths.reduce((a,b)=>a+b+3,1))));
  }

  // ── Data rows ──
  for (let ri = 0; ri < data.length; ri++) {
    const row    = data[ri];
    const isEven = ri % 2 === 0;
    const rowBg  = isEven ? '' : `${colors.d}`;

    const cells = headers.map((h, ci) => {
      const val = row[h] !== undefined ? String(row[h]) : '';
      const alignment = alignOpts[h] || 'left';
      const aligned = alignCell(val, colWidths[ci], alignment);
      return ` ${rowBg}${colors.fog}${aligned}${colors.r} `;
    });
    writeln(colorFn(v) + cells.join(colorFn(v)) + colorFn(v));
  }

  // ── Bottom border ──
  if (border.bl) {
    const line = border.bl +
      colWidths.map(w => border.h.repeat(w + 2)).join(border.bm) +
      border.br;
    writeln(colorFn(line));
  }
}
