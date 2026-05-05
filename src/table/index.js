// ─── lumi-cli / table ────────────────────────────────────────────────────

import { writeln, c as colors, cols, visibleLen, truncate, getColorTheme } from '../ansi.js';

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
  const alignOpts  = options.align   || {};   // { columnName: 'right' | 'center' | 'left' }
  const maxWidths  = options.maxWidth || {};   // { columnName: number }
  const zebra      = options.zebra !== false;  // zebra striping on by default
  const highlight  = options.highlight || null; // { columnName: value } to highlight cells
  const compact    = options.compact || false;  // reduce padding for dense tables

  // Whether the border style actually has cell separators. When it doesn't
  // (minimal border), corners are empty strings and we need a different
  // horizontal rule calculation for the header divider.
  const hasBorder = Boolean(border.tl);

  // Compute column widths using visibleLen (wide-char aware)
  const colWidths = headers.map((h) => {
    const dataMax = Math.max(...data.map(row => {
      const val = row[h] !== undefined ? String(row[h]) : '';
      return visibleLen(val);
    }));
    let w = Math.max(visibleLen(h), dataMax);
    if (maxWidths[h] && w > maxWidths[h]) {
      w = maxWidths[h];
    }
    return w;
  });

  // Pad/align a cell value (no color applied here — color is applied by caller).
  // When truncation kicks in we swap the default `…` tail for a colored `▸`
  // so the user can *see* which cells were clipped without having to compare
  // to the source data. The wedge renders in 1 column, same width as `…`.
  function alignCell(str, w, alignment) {
    const s = String(str ?? '');
    const vis = visibleLen(s);
    let text;
    if (vis > w) {
      text = truncate(s, w).replace(/…$/, `${colors.amber}▸${colors.r}`);
    } else {
      text = s;
    }
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
    return text + ' '.repeat(spaces);
  }

  const v = border.v;
  const hdrColor = (s) => `${colors.chalk}${colors.b}${s}${colors.r}`;

  // ── Top border ──
  if (hasBorder) {
    writeln(colorFn(
      border.tl +
      colWidths.map(w => border.h.repeat(w + 2)).join(border.tm) +
      border.tr
    ));
  }

  // ── Header ──
  const hdrCells = headers.map((h, i) => {
    const aligned = alignCell(h, colWidths[i], alignOpts[h] || 'left');
    return ` ${hdrColor(aligned)} `;
  });
  writeln(colorFn(v) + hdrCells.join(colorFn(v)) + colorFn(v));

  // ── Header divider ──
  if (hasBorder) {
    writeln(colorFn(
      border.ml +
      colWidths.map(w => border.h.repeat(w + 2)).join(border.x) +
      border.mr
    ));
  } else {
    // Minimal: width = left border + sum(colW + 2 padding) + (n-1) separators + right border.
    // Each separator/border 'v' is 1 char wide for the minimal style.
    const totalW = colWidths.reduce((a, b) => a + b + 2, 0) + colWidths.length + 1;
    writeln(colorFn(border.h.repeat(totalW)));
  }

  // ── Data rows ──
  //
  // Enhanced row rendering with zebra striping, highlighting, and visual
  // indicators. Each row gets semantic coloring based on content and position.
  for (let ri = 0; ri < data.length; ri++) {
    const row    = data[ri];
    const isOdd  = ri % 2 === 1;
    const rowDim = (zebra && isOdd) ? colors.d : '';
    const rowFg  = (zebra && isOdd) ? colors.mist : colors.fog;
    
    // Add visual row indicator for important rows
    const rowMarker = highlight && highlight.columnName && row[highlight.columnName] === highlight.value
      ? `${colors.sage}◆${colors.r}`
      : ' ';

    const cells = headers.map((h, ci) => {
      const val = row[h] !== undefined ? String(row[h]) : '';
      const alignment = alignOpts[h] || 'left';
      const aligned = alignCell(val, colWidths[ci], alignment);
      
      // Apply highlighting to specific cells
      const isHighlighted = highlight && h === highlight.columnName && val === String(highlight.value);
      const cellColor = isHighlighted
        ? `${colors.sage}${colors.b}`
        : `${rowDim}${rowFg}`;
      
      return ` ${cellColor}${aligned}${colors.r} `;
    });
    
    const cellsStr = cells.join(colorFn(v));
    writeln(colorFn(v) + rowMarker + cellsStr + colorFn(v));
  }

  // ── Bottom border ──
  if (hasBorder) {
    writeln(colorFn(
      border.bl +
      colWidths.map(w => border.h.repeat(w + 2)).join(border.bm) +
      border.br
    ));
  }
}
