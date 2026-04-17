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
  write, writeln, ansi, cols, rows, c as colors,
  isTTY, visibleLen, truncate, padEnd, stripAnsi,
  registerCleanup, getColorTheme,
} from '../ansi.js';

const ESC = '\x1b[';
const altScreenEnter = `${ESC}?1049h`;
const altScreenExit  = `${ESC}?1049l`;
const clearScreen    = `${ESC}2J`;

// ─── Border styles (local copy — keeps module self-contained) ─────────────

const BORDERS = {
  single:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double:  { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  thick:   { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
  dashed:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '╌', v: '╎' },
  ascii:   { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
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

// ─── Layout ───────────────────────────────────────────────────────────────

export class Layout {
  constructor(options = {}) {
    this._rowSpecs  = options.rows ?? ['*'];
    this._colSpecs  = options.cols ?? ['*'];
    this._cellSpecs = options.cells ?? {};
    this._content   = {};
    this._lastFrame    = new Map();   // name → array of last rendered full lines
    this._lastGeometry = new Map();
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

/** Factory shorthand matching statusBar() / spinner() / progressBar(). */
export function layout(options) {
  return new Layout(options);
}

// ─── Internal helpers re-exported for tests only ──────────────────────────

export const __test = { parseTrack, resolveTracks, cellGeometry, renderCellBlock };
