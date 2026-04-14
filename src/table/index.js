// ─── lumina-cli / table ────────────────────────────────────────────────────

import { writeln, c as colors, cols, visibleLen, stripAnsi, ansi } from '../ansi.js';

const BORDERS = {
  single: { tl:'┌',tr:'┐',bl:'└',br:'┘',h:'─',v:'│',ml:'├',mr:'┤',tm:'┬',bm:'┴',x:'┼' },
  thick:  { tl:'┏',tr:'┓',bl:'┗',br:'┛',h:'━',v:'┃',ml:'┣',mr:'┫',tm:'┳',bm:'┻',x:'╋' },
  double: { tl:'╔',tr:'╗',bl:'╚',br:'╝',h:'═',v:'║',ml:'╠',mr:'╣',tm:'╦',bm:'╩',x:'╬' },
  minimal:{ tl:'',tr:'',bl:'',br:'',h:'─',v:' ',ml:'',mr:'',tm:'',bm:'',x:'' },
};

const THEME = {
  default:  (s) => `${colors.graphite}${s}${colors.r}`,
  signal:   (s) => `${colors.signal}${s}${colors.r}`,
  azure:    (s) => `${colors.azure}${s}${colors.r}`,
};

export function table(data, options = {}) {
  if (!data || data.length === 0) return;

  const border   = BORDERS[options.border || 'single'];
  const colorFn  = THEME[options.color || 'default'];
  const headers  = options.headers || Object.keys(data[0]);
  const maxW     = options.width   || cols();

  // Compute column widths
  const colWidths = headers.map((h, ci) => {
    const dataMax = Math.max(...data.map(row => {
      const val = row[h] !== undefined ? String(row[h]) : '';
      return visibleLen(val);
    }));
    return Math.max(visibleLen(h), dataMax);
  });

  // Pad each cell
  const pad = (str, w) => {
    const s = String(str ?? '');
    return s + ' '.repeat(Math.max(0, w - visibleLen(s)));
  };

  const v = border.v;
  const sep = ` ${v} `;

  // Header row color
  const hdrColor = (s) => `${colors.chalk}${colors.b}${s}${colors.r}`;

  // ── Top border ──
  if (border.tl) {
    const line = border.tl +
      colWidths.map(w => border.h.repeat(w + 2)).join(border.tm) +
      border.tr;
    writeln(colorFn(line));
  }

  // ── Header ──
  const hdrCells = headers.map((h, i) => ` ${hdrColor(pad(h, colWidths[i]))} `);
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
      return ` ${rowBg}${colors.fog}${pad(val, colWidths[ci])}${colors.r} `;
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
