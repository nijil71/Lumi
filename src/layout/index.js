// ─── lumi-cli / layout ──────────────────────────────────────────────────────
//
// Grid-based region renderer. Split the terminal into named cells and update
// each independently. Uses per-cell line-level diffing — only the lines that
// actually changed between frames are rewritten, so updating one cell in a
// busy dashboard doesn't flicker the rest of the screen.
//
// Uses the alternate screen buffer (same pattern as pager) so the layout owns
// the viewport for its lifetime and never clobbers scrollback.

import {
  write, writeln, ansi, cols, rows,
  isTTY, visibleLen, truncate, padEnd, stripAnsi,
  registerCleanup, getColorTheme,
} from '../ansi.js';

import { parseSketch } from './sketch.js';

const ESC = '\x1b[';
const altScreenEnter = `${ESC}?1049h`;
const altScreenExit  = `${ESC}?1049l`;
const clearScreen    = `${ESC}2J`;

// ─── Border styles ────────────────────────────────────────────────────────
//
// Each style includes T-junction and cross glyphs needed by the shared-border
// grid renderer (`gridBorder` mode). `tup`=┴, `tdown`=┬, `tleft`=┤,
// `tright`=├, `cross`=┼.

const BORDERS = {
  single:  { tl:'┌', tr:'┐', bl:'└', br:'┘', h:'─', v:'│',
             tup:'┴', tdown:'┬', tleft:'┤', tright:'├', cross:'┼' },
  double:  { tl:'╔', tr:'╗', bl:'╚', br:'╝', h:'═', v:'║',
             tup:'╩', tdown:'╦', tleft:'╣', tright:'╠', cross:'╬' },
  rounded: { tl:'╭', tr:'╮', bl:'╰', br:'╯', h:'─', v:'│',
             tup:'┴', tdown:'┬', tleft:'┤', tright:'├', cross:'┼' },
  thick:   { tl:'┏', tr:'┓', bl:'┗', br:'┛', h:'━', v:'┃',
             tup:'┻', tdown:'┳', tleft:'┫', tright:'┣', cross:'╋' },
  dashed:  { tl:'┌', tr:'┐', bl:'└', br:'┘', h:'╌', v:'╎',
             tup:'┴', tdown:'┬', tleft:'┤', tright:'├', cross:'┼' },
  ascii:   { tl:'+', tr:'+', bl:'+', br:'+', h:'-', v:'|',
             tup:'+', tdown:'+', tleft:'+', tright:'+', cross:'+' },
};

// ─── Track spec parsing ───────────────────────────────────────────────────
//
//   <number>      → fixed size in cells
//   "20" | "20"   → fixed size
//   "*"           → flex with weight 1
//   "2*", "3*"    → flex with explicit weight
//   "40%"         → percent of the parent dimension

function parseTrack(spec) {
  if (typeof spec === 'number' && Number.isFinite(spec)) {
    return { type: 'fixed', value: Math.max(0, Math.floor(spec)) };
  }
  const s = String(spec).trim();
  if (s === '*') return { type: 'flex', weight: 1 };
  const flex = s.match(/^(\d+)\*$/);
  if (flex) return { type: 'flex', weight: Math.max(1, parseInt(flex[1], 10)) };
  const pct = s.match(/^(\d+)%$/);
  if (pct) return { type: 'percent', value: Math.max(0, Math.min(100, parseInt(pct[1], 10))) };
  if (/^\d+$/.test(s)) return { type: 'fixed', value: parseInt(s, 10) };
  throw new Error(`Layout: invalid track spec "${spec}" (use number, "*", "N*", or "N%")`);
}

function resolveTracks(specs, total) {
  const parsed = specs.map(parseTrack);
  const sizes  = new Array(parsed.length).fill(0);
  let remaining = total;

  // Fixed tracks consume their literal size.
  parsed.forEach((p, i) => {
    if (p.type === 'fixed') { sizes[i] = p.value; remaining -= p.value; }
  });

  // Percent tracks are percent of the original total, not the remainder —
  // that way "50%" always means half the screen regardless of other tracks.
  parsed.forEach((p, i) => {
    if (p.type === 'percent') {
      sizes[i] = Math.max(0, Math.floor(total * p.value / 100));
      remaining -= sizes[i];
    }
  });

  // Flex tracks split whatever is left, weighted. The last flex track absorbs
  // rounding drift so the track sum equals `total` exactly (assuming no overflow).
  const flexIdx = [];
  parsed.forEach((p, i) => { if (p.type === 'flex') flexIdx.push(i); });
  if (flexIdx.length > 0) {
    const flexTotal   = Math.max(0, remaining);
    const totalWeight = flexIdx.reduce((s, i) => s + parsed[i].weight, 0);
    let allocated = 0;
    flexIdx.forEach((i, k) => {
      if (k === flexIdx.length - 1) {
        sizes[i] = Math.max(0, flexTotal - allocated);
      } else {
        const share = Math.max(0, Math.floor(flexTotal * parsed[i].weight / totalWeight));
        sizes[i] = share;
        allocated += share;
      }
    });
  }
  return sizes;
}

// ─── Cell geometry ────────────────────────────────────────────────────────

function normalizeRange(value, max, axis) {
  let start, end;
  if (Array.isArray(value)) { start = value[0]; end = value[1]; }
  else                      { start = end = value; }
  if (!Number.isInteger(start) || !Number.isInteger(end) ||
      start < 0 || end < start || end >= max) {
    throw new RangeError(
      `Layout: ${axis} ${JSON.stringify(value)} out of range — must be integer(s) in 0..${max - 1}`
    );
  }
  return { start, end };
}

function cellGeometry(cell, rowSizes, colSizes) {
  const r  = normalizeRange(cell.row, rowSizes.length, 'row');
  const cr = normalizeRange(cell.col, colSizes.length, 'col');
  let y = 0;
  for (let i = 0; i < r.start;  i++) y += rowSizes[i];
  let h = 0;
  for (let i = r.start; i <= r.end; i++) h += rowSizes[i];
  let x = 0;
  for (let i = 0; i < cr.start; i++) x += colSizes[i];
  let w = 0;
  for (let i = cr.start; i <= cr.end; i++) w += colSizes[i];
  return { x, y, w, h };
}

// ─── Content normalization ────────────────────────────────────────────────

function contentToLines(content) {
  if (content == null) return [];
  if (typeof content === 'function') return contentToLines(content());
  if (Array.isArray(content)) return content.flatMap(s => String(s).split('\n'));
  return String(content).split('\n');
}

// ─── Render one cell to a fixed-size block of padded, full-width lines ────

function renderCellBlock(cell, content, w, h) {
  if (w <= 0 || h <= 0) return [];
  const border  = cell.border ? BORDERS[cell.border] : null;
  const colorFn = cell.color ? getColorTheme(cell.color) : null;
  const paint   = colorFn ? (s) => colorFn(s) : (s) => s;

  const innerW = border ? Math.max(0, w - 2) : w;
  const innerH = border ? Math.max(0, h - 2) : h;

  // Interior: clip height, pad/truncate width. Keep user ANSI codes inside.
  let body = contentToLines(content).slice(0, innerH).map((l) => {
    const vis = visibleLen(l);
    if (vis === innerW) return l;
    if (vis >  innerW) return truncate(l, innerW);
    return padEnd(l, innerW);
  });
  while (body.length < innerH) body.push(' '.repeat(innerW));

  if (!border) return body;

  // Top border, with optional inline title ( `─── Title ──────` style).
  let topLine;
  const title = cell.title ? ` ${cell.title} ` : null;
  const tw    = title ? visibleLen(stripAnsi(title)) : 0;
  if (title && tw + 2 <= innerW) {
    const after = innerW - 1 - tw;
    topLine = paint(border.tl + border.h + title + border.h.repeat(Math.max(0, after)) + border.tr);
  } else {
    topLine = paint(border.tl + border.h.repeat(innerW) + border.tr);
  }

  const left  = paint(border.v);
  const right = paint(border.v);
  const bodyLines = body.map(l => left + l + right);
  const botLine   = paint(border.bl + border.h.repeat(innerW) + border.br);

  return [topLine, ...bodyLines, botLine];
}

// ─── Shared-border grid rendering (gridBorder mode) ───────────────────────
//
// Normal Layout gives each cell its own border. Grid mode draws a single
// frame with shared borders between cells, picking the right T-junction /
// cross char at every intersection based on which neighbours are present.
// The big payoff: the rendered output can look exactly like an ASCII
// wireframe — which is exactly what `Layout.sketch` exploits.

function pickJunction(br, up, down, left, right) {
  const n = (up ? 1 : 0) + (down ? 1 : 0) + (left ? 1 : 0) + (right ? 1 : 0);
  if (n === 4) return br.cross;
  if (n === 3) {
    if (!up)    return br.tdown;
    if (!down)  return br.tup;
    if (!left)  return br.tright;
    return br.tleft;
  }
  if (n === 2) {
    if (up && down)    return br.v;
    if (left && right) return br.h;
    if (down && right) return br.tl;
    if (down && left)  return br.tr;
    if (up && right)   return br.bl;
    return br.br;
  }
  if (n === 1) return (up || down) ? br.v : br.h;
  return ' ';
}

/**
 * Build a 2D array [r][c] → cell name (or null). Each cell paints its
 * entire (row × col) span in the map; overlaps throw.
 */
function buildCellMap(cellSpecs, nRows, nCols) {
  const map = Array.from({ length: nRows }, () => new Array(nCols).fill(null));
  for (const [name, spec] of Object.entries(cellSpecs)) {
    const r  = normalizeRange(spec.row, nRows, 'row');
    const cr = normalizeRange(spec.col, nCols, 'col');
    for (let rr = r.start; rr <= r.end; rr++) {
      for (let cc = cr.start; cc <= cr.end; cc++) {
        if (map[rr][cc]) {
          throw new Error(`Layout: cells "${map[rr][cc]}" and "${name}" overlap at track (${rr},${cc})`);
        }
        map[rr][cc] = name;
      }
    }
  }
  return map;
}

/**
 * Grid-mode interior geometry for a cell (no borders, just the content area).
 * Accounts for the 1-char frame at every track boundary.
 */
function gridCellInterior(cell, rowSizes, colSizes) {
  const r  = normalizeRange(cell.row, rowSizes.length, 'row');
  const cr = normalizeRange(cell.col, colSizes.length, 'col');
  let x = 1 + cr.start;
  for (let i = 0; i < cr.start; i++) x += colSizes[i];
  let w = (cr.end - cr.start);            // border chars absorbed by the span
  for (let i = cr.start; i <= cr.end; i++) w += colSizes[i];
  let y = 1 + r.start;
  for (let i = 0; i < r.start; i++) y += rowSizes[i];
  let h = (r.end - r.start);
  for (let i = r.start; i <= r.end; i++) h += rowSizes[i];
  return { x, y, w, h };
}

/**
 * Draw the shared-border grid frame. Returns one string per visual row,
 * width = sum(colSizes) + nCols + 1, height = sum(rowSizes) + nRows + 1.
 *
 * Algorithm:
 *   1. Flood every edge position with h/v chars.
 *   2. Erase interior segments where the cells on both sides are the same
 *      cell (span absorbs the divider).
 *   3. Resolve each intersection to the right corner/T/cross/straight char
 *      based on which of its four neighbours survived step 2.
 *   4. Overlay titles onto the top edge of each cell that declares one.
 */
function drawGridFrame(cellMap, cellSpecs, rowSizes, colSizes, borderStyle) {
  const br    = BORDERS[borderStyle] || BORDERS.single;
  const nRows = rowSizes.length;
  const nCols = colSizes.length;
  const totalW = colSizes.reduce((a, b) => a + b, 0) + nCols + 1;
  const totalH = rowSizes.reduce((a, b) => a + b, 0) + nRows + 1;
  if (totalW <= 0 || totalH <= 0) return [];

  // Pre-compute border-line coordinates
  const rowEdges = [0];
  for (let i = 0; i < nRows; i++) rowEdges.push(rowEdges[i] + rowSizes[i] + 1);
  const colEdges = [0];
  for (let i = 0; i < nCols; i++) colEdges.push(colEdges[i] + colSizes[i] + 1);

  // 1. Fill all edges
  const canvas = Array.from({ length: totalH }, () => new Array(totalW).fill(' '));
  for (let e = 0; e <= nRows; e++) {
    const y = rowEdges[e];
    for (let x = 0; x < totalW; x++) canvas[y][x] = br.h;
  }
  for (let e = 0; e <= nCols; e++) {
    const x = colEdges[e];
    for (let y = 0; y < totalH; y++) canvas[y][x] = br.v;
  }

  // 2. Erase interior segments that fall inside a spanning cell
  for (let e = 1; e < nRows; e++) {
    const y = rowEdges[e];
    for (let c = 0; c < nCols; c++) {
      if (cellMap[e - 1][c] !== null && cellMap[e - 1][c] === cellMap[e][c]) {
        for (let x = colEdges[c] + 1; x < colEdges[c + 1]; x++) canvas[y][x] = ' ';
      }
    }
  }
  for (let e = 1; e < nCols; e++) {
    const x = colEdges[e];
    for (let r = 0; r < nRows; r++) {
      if (cellMap[r][e - 1] !== null && cellMap[r][e - 1] === cellMap[r][e]) {
        for (let y = rowEdges[r] + 1; y < rowEdges[r + 1]; y++) canvas[y][x] = ' ';
      }
    }
  }

  // 3. Fix up intersections
  for (let f = 0; f <= nRows; f++) {
    for (let e = 0; e <= nCols; e++) {
      const y = rowEdges[f], x = colEdges[e];
      const up    = y > 0          && canvas[y - 1][x] === br.v;
      const down  = y < totalH - 1 && canvas[y + 1][x] === br.v;
      const left  = x > 0          && canvas[y][x - 1] === br.h;
      const right = x < totalW - 1 && canvas[y][x + 1] === br.h;
      canvas[y][x] = pickJunction(br, up, down, left, right);
    }
  }

  // 4. Titles on top edge of each cell
  for (const [, spec] of Object.entries(cellSpecs)) {
    if (!spec.title) continue;
    const r  = normalizeRange(spec.row, nRows, 'row');
    const cr = normalizeRange(spec.col, nCols, 'col');
    const y  = rowEdges[r.start];
    const xStart = colEdges[cr.start];
    const xEnd   = colEdges[cr.end + 1];
    const span   = xEnd - xStart - 1;   // usable horizontal chars between the two corners
    const title  = ` ${spec.title} `;
    const tw     = visibleLen(title);
    if (tw + 2 > span) continue;        // fall back to plain border when too tight
    const anchor = xStart + 2;          // one h char, then the title
    for (let i = 0; i < tw; i++) canvas[y][anchor + i] = [...title][i] ?? ' ';
  }

  return canvas.map(row => row.join(''));
}

// ─── Layout ───────────────────────────────────────────────────────────────

export class Layout {
  constructor(options = {}) {
    this._rowSpecs  = options.rows ?? ['*'];
    this._colSpecs  = options.cols ?? ['*'];
    this._cellSpecs = options.cells ?? {};
    this._gridBorder = options.gridBorder ?? null;   // 'single' | 'double' | ... enables shared-border mode
    this._gridColor  = options.gridColor  ?? null;
    this._content   = {};
    this._lastFrame    = new Map();   // name → array of last rendered full lines
    this._lastGeometry = new Map();
    this._lastFrameKey = null;        // grid mode: invalidates frame on resize
    this._started     = false;
    this._nonTTY      = !isTTY();
    this._unregister  = null;
    this._onResize    = null;
  }

  /**
   * Set a cell's content. Accepts:
   *   - string (may contain '\n')
   *   - string[] (one entry per line)
   *   - () => string | string[]  — re-invoked on every render()
   */
  set(name, content) {
    if (!(name in this._cellSpecs)) {
      throw new Error(`Layout: unknown cell "${name}"`);
    }
    this._content[name] = content;
    return this;
  }

  /** Force the next render() to rewrite every line (bypass diff). */
  invalidate() {
    this._lastFrame.clear();
    this._lastFrameKey = null;
    return this;
  }

  /** Enter alt screen, hide cursor, bind resize + cleanup. */
  start() {
    if (this._started) return this;
    this._started = true;

    if (this._nonTTY) return this;

    this._unregister = registerCleanup(() => this._teardown());
    write(altScreenEnter + ansi.hide() + clearScreen + ansi.pos(1, 1));

    this._onResize = () => {
      this._lastFrame.clear();
      write(clearScreen + ansi.pos(1, 1));
      this.render();
    };
    process.stdout.on('resize', this._onResize);
    return this;
  }

  /** Leave alt screen, restore cursor, remove handlers. */
  stop() {
    if (!this._started) return this;
    this._started = false;
    if (this._onResize) {
      process.stdout.off('resize', this._onResize);
      this._onResize = null;
    }
    this._teardown();
    if (this._unregister) { this._unregister(); this._unregister = null; }
    return this;
  }

  _teardown() {
    if (this._nonTTY) return;
    write(altScreenExit + ansi.show());
  }

  /** Compute and emit only the lines that changed since the last render. */
  render() {
    if (this._nonTTY) return this._renderFallback();
    if (!this._started) this.start();

    const vpCols = cols();
    const vpRows = rows();

    if (this._gridBorder) return this._renderGrid(vpCols, vpRows);

    const rowSizes = resolveTracks(this._rowSpecs, vpRows);
    const colSizes = resolveTracks(this._colSpecs, vpCols);

    let out = '';
    for (const [name, spec] of Object.entries(this._cellSpecs)) {
      const geom = cellGeometry(spec, rowSizes, colSizes);
      if (geom.w <= 0 || geom.h <= 0) { this._lastFrame.delete(name); continue; }

      // Geometry change → invalidate this cell's diff cache.
      const prevGeom = this._lastGeometry.get(name);
      if (!prevGeom ||
          prevGeom.x !== geom.x || prevGeom.y !== geom.y ||
          prevGeom.w !== geom.w || prevGeom.h !== geom.h) {
        this._lastFrame.delete(name);
      }
      this._lastGeometry.set(name, geom);

      const block = renderCellBlock(spec, this._content[name], geom.w, geom.h);
      const prev  = this._lastFrame.get(name) || [];

      for (let i = 0; i < block.length; i++) {
        if (prev[i] !== block[i]) {
          // +1 because terminal rows/cols are 1-based.
          out += ansi.pos(1 + geom.y + i, 1 + geom.x) + block[i];
        }
      }
      this._lastFrame.set(name, block);
    }
    // Park the cursor out of the way — last line, first column.
    out += ansi.pos(vpRows, 1);
    write(out);
    return this;
  }

  /** Shared-border grid render path. Draws one frame + diffed cell interiors. */
  _renderGrid(vpCols, vpRows) {
    const nRows = this._rowSpecs.length;
    const nCols = this._colSpecs.length;
    const contentCols = Math.max(0, vpCols - (nCols + 1));
    const contentRows = Math.max(0, vpRows - (nRows + 1));
    const rowSizes = resolveTracks(this._rowSpecs, contentRows);
    const colSizes = resolveTracks(this._colSpecs, contentCols);

    const cellMap = buildCellMap(this._cellSpecs, nRows, nCols);
    const frame   = drawGridFrame(cellMap, this._cellSpecs, rowSizes, colSizes, this._gridBorder);
    const paint   = this._gridColor ? getColorTheme(this._gridColor) : null;
    const framed  = paint ? frame.map(l => paint(l)) : frame;

    let out = '';

    // Redraw the frame when the viewport size changes (cheap heuristic —
    // cellSpecs are immutable so any re-layout comes from a resize).
    const key = `${vpCols}x${vpRows}`;
    if (this._lastFrameKey !== key) {
      for (let i = 0; i < framed.length; i++) {
        out += ansi.pos(1 + i, 1) + framed[i];
      }
      this._lastFrameKey = key;
      this._lastFrame.clear();
      this._lastGeometry.clear();
    }

    // Render each cell's interior (no border — the grid owns it).
    for (const [name, spec] of Object.entries(this._cellSpecs)) {
      const interior = gridCellInterior(spec, rowSizes, colSizes);
      if (interior.w <= 0 || interior.h <= 0) { this._lastFrame.delete(name); continue; }

      const prevGeom = this._lastGeometry.get(name);
      if (!prevGeom ||
          prevGeom.x !== interior.x || prevGeom.y !== interior.y ||
          prevGeom.w !== interior.w || prevGeom.h !== interior.h) {
        this._lastFrame.delete(name);
      }
      this._lastGeometry.set(name, interior);

      const interiorSpec = { ...spec, border: null, title: null };
      const block = renderCellBlock(interiorSpec, this._content[name], interior.w, interior.h);
      const prev  = this._lastFrame.get(name) || [];

      for (let i = 0; i < block.length; i++) {
        if (prev[i] !== block[i]) {
          out += ansi.pos(1 + interior.y + i, 1 + interior.x) + block[i];
        }
      }
      this._lastFrame.set(name, block);
    }

    out += ansi.pos(vpRows, 1);
    write(out);
    return this;
  }

  /** Non-TTY: print each cell's content sequentially with a header. */
  _renderFallback() {
    const termW = Math.max(40, cols());
    const rowSizes = resolveTracks(this._rowSpecs, 24);
    const colSizes = resolveTracks(this._colSpecs, termW);
    for (const [name, spec] of Object.entries(this._cellSpecs)) {
      const geom  = cellGeometry(spec, rowSizes, colSizes);
      const block = renderCellBlock(spec, this._content[name], geom.w, geom.h);
      const rule  = '─'.repeat(Math.max(0, Math.min(60, termW) - name.length - 4));
      writeln(`── ${name} ${rule}`);
      for (const line of block) writeln(line);
    }
    return this;
  }
}

/**
 * Build a Layout from an ASCII / Unicode wireframe.
 *
 * Supports two call forms:
 *   Layout.sketch`... template ...`              (tagged template literal)
 *   Layout.sketch('... template ...', options?)  (function form w/ options)
 *
 * The sketch's corner characters pick the border style (╭ rounded, ╔ double,
 * + ascii …); proportional drawn widths become flex track weights; and
 * cell names are read from either the interior text or the top-border text.
 *
 * Options:
 *   gridColor — paint the grid frame with a palette color
 *   titles    — { [cell]: string } — render a title on the top edge
 *   cells     — per-cell overrides (color for interior content)
 *   gridBorder — override the auto-detected border style
 */
Layout.sketch = function sketch(strings, ...values) {
  // Detect call form: tagged template vs plain string
  let raw;
  let options;
  if (Array.isArray(strings) && 'raw' in strings) {
    raw = strings.raw.reduce(
      (acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ''),
      ''
    );
    options = {};    // tagged-template form takes no options (kept terse on purpose)
  } else if (typeof strings === 'string') {
    raw = strings;
    options = (values[0] && typeof values[0] === 'object') ? values[0] : {};
  } else {
    throw new TypeError('Layout.sketch: expected a template literal or string');
  }

  const parsed = parseSketch(raw);

  // Merge: per-cell overrides (title, color) layer onto parsed cells.
  const titles    = options.titles || {};
  const overrides = options.cells || {};
  const cells     = {};
  for (const [name, spec] of Object.entries(parsed.cells)) {
    cells[name] = {
      ...spec,
      title: titles[name] ?? spec.title,
      ...(overrides[name] || {}),
    };
  }

  return new Layout({
    rows:       options.rows ?? parsed.rows,
    cols:       options.cols ?? parsed.cols,
    cells,
    gridBorder: options.gridBorder ?? parsed.border,
    gridColor:  options.gridColor,
  });
};

/** Factory shorthand matching statusBar() / spinner() / progressBar(). */
export function layout(options) {
  return new Layout(options);
}

// ─── Internal helpers re-exported for tests only ──────────────────────────

export const __test = {
  parseTrack, resolveTracks, cellGeometry, renderCellBlock,
  buildCellMap, gridCellInterior, drawGridFrame, pickJunction,
};
