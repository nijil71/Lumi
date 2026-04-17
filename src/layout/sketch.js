// ─── lumi-cli / layout / sketch ─────────────────────────────────────────────
//
// Parse an ASCII / Unicode wireframe into a Layout configuration.
//
// The sketch IS the layout. Draw cells with box-drawing characters, put
// names inside (or on the top border), and the parser infers:
//
//   * border style      — from the corner chars you drew
//   * cell names        — from the text inside each region
//   * row / col tracks  — from the drawn proportions
//   * cell spans        — from identical labels OR missing dividers
//
// Accepts both Unicode box chars (┌─┐╔═╗╭╮╰╯┏━┓╌╎) and plain ASCII (+-|)
// so users can author in any editor.

const CORNERS = new Set('┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬╭╮╰╯┏┓┗┛┣┫┳┻╋+');
const HORIZ   = new Set('─═━╌-');
const VERT    = new Set('│║┃╎|');
const BORDER  = new Set([...CORNERS, ...HORIZ, ...VERT]);

const STYLE_BY_CORNER = {
  '┌': 'single',  '┐': 'single',  '└': 'single',  '┘': 'single',
  '├': 'single',  '┤': 'single',  '┬': 'single',  '┴': 'single',  '┼': 'single',
  '╭': 'rounded', '╮': 'rounded', '╰': 'rounded', '╯': 'rounded',
  '╔': 'double',  '╗': 'double',  '╚': 'double',  '╝': 'double',
  '╠': 'double',  '╣': 'double',  '╦': 'double',  '╩': 'double',  '╬': 'double',
  '┏': 'thick',   '┓': 'thick',   '┗': 'thick',   '┛': 'thick',
  '┣': 'thick',   '┫': 'thick',   '┳': 'thick',   '┻': 'thick',   '╋': 'thick',
  '+': 'ascii',
};

const LABEL_RE = /^[\w\-.]+$/;

function dedent(str) {
  let lines = str.replace(/\t/g, '    ').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0) return [];
  const nonEmpty = lines.filter(l => l.trim());
  const indent   = Math.min(...nonEmpty.map(l => l.match(/^ */)[0].length));
  return lines.map(l => l.slice(indent));
}

function detectStyle(canvas) {
  for (const row of canvas) {
    for (const ch of row) {
      const s = STYLE_BY_CORNER[ch];
      if (s) return s;
    }
  }
  return 'single';
}

/**
 * Pre-classify each row as a border line — rows containing any horizontal
 * or corner character. This lets us absorb labels that appear ON the top
 * border (`┌─ header ─┐`) into the border, instead of leaking them into
 * the interior as L-shaped regions.
 *
 * We do NOT classify whole columns the same way, because a vertical
 * divider between two cells frequently STOPS where a spanning cell
 * crosses over it — the "border-ness" of that column varies row by row.
 */
function classifyLines(canvas, H) {
  const borderRow = new Array(H).fill(false);
  for (let y = 0; y < H; y++) {
    for (const ch of canvas[y]) {
      if (HORIZ.has(ch) || CORNERS.has(ch)) { borderRow[y] = true; break; }
    }
  }
  return { borderRow };
}

/**
 * Is (y, x) effectively a border for flood-fill purposes?
 *   - Any position on a border row is border (absorbs labels on the edge).
 *   - Off the border rows, only explicit border chars block the fill —
 *     that way a spanning cell flows freely through the *spaces* where a
 *     divider would otherwise be.
 */
function isEffectiveBorder(canvas, y, x, borderRow) {
  if (borderRow[y]) return true;
  const ch = canvas[y][x];
  return ch == null || BORDER.has(ch);
}

/**
 * Flood-fill every non-border cell into connected regions. A region is
 * accepted only if it's a perfect rectangle — anything L-shaped or
 * donut-shaped is a malformed sketch and throws.
 */
function findRegions(canvas, H, W, borderRow) {
  const visited = Array.from({ length: H }, () => new Array(W).fill(false));
  const regions = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (visited[y][x]) continue;
      if (isEffectiveBorder(canvas, y, x, borderRow)) continue;
      let minY = y, maxY = y, minX = x, maxX = x, count = 0;
      const stack = [[y, x]];
      while (stack.length) {
        const [cy, cx] = stack.pop();
        if (cy < 0 || cy >= H || cx < 0 || cx >= W) continue;
        if (visited[cy][cx]) continue;
        if (isEffectiveBorder(canvas, cy, cx, borderRow)) continue;
        visited[cy][cx] = true;
        count++;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        stack.push([cy + 1, cx], [cy - 1, cx], [cy, cx + 1], [cy, cx - 1]);
      }
      const area = (maxY - minY + 1) * (maxX - minX + 1);
      if (count !== area) {
        throw new Error(`Layout.sketch: region starting at (${y},${x}) is not rectangular — every cell must be a clean box`);
      }
      regions.push({ minY, maxY, minX, maxX });
    }
  }
  return regions;
}

/**
 * Label priority:
 *   1. First non-space / non-border token found inside the region.
 *   2. First token on the row immediately above (the top border line).
 * Rule (2) supports the titled-box style `┌─ header ─┐` where the label
 * lives on the border rather than inside.
 */
function extractLabel(canvas, { minY, maxY, minX, maxX }) {
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const ch = canvas[y][x];
      if (ch && ch !== ' ' && !BORDER.has(ch)) {
        let word = '';
        for (let xx = x; xx <= maxX; xx++) {
          const c = canvas[y][xx];
          if (!c || c === ' ' || BORDER.has(c)) break;
          word += c;
        }
        if (LABEL_RE.test(word)) return word;
      }
    }
  }
  if (minY > 0) {
    const row = canvas[minY - 1];
    let text = '';
    for (let x = Math.max(0, minX - 1); x <= Math.min(row.length - 1, maxX + 1); x++) {
      const c = row[x];
      text += (!c || BORDER.has(c)) ? ' ' : c;
    }
    const word = text.trim().split(/\s+/)[0];
    if (word && LABEL_RE.test(word)) return word;
  }
  return null;
}

/**
 * Parse a sketch into a Layout-compatible config.
 * Returns: { rows, cols, cells, border }
 *
 *   rows / cols — track specs (flex weights proportional to drawn sizes)
 *   cells       — { [name]: { row, col, title? } }
 *   border      — inferred border style for `gridBorder`
 */
export function parseSketch(str) {
  const dedented = dedent(str);
  if (dedented.length === 0) {
    throw new Error('Layout.sketch: empty template');
  }
  const H = dedented.length;
  const W = Math.max(...dedented.map(l => [...l].length));
  const canvas = dedented.map(l => [...l.padEnd(W, ' ')]);

  const border  = detectStyle(canvas);
  const { borderRow } = classifyLines(canvas, H);
  const regions = findRegions(canvas, H, W, borderRow);
  const labeled = [];
  for (const r of regions) {
    const label = extractLabel(canvas, r);
    if (label) labeled.push({ ...r, label });
  }
  if (labeled.length === 0) {
    throw new Error('Layout.sketch: no labeled cells found — put the cell name inside or on the top border');
  }

  // Duplicate label check — surfaces typos instead of silently merging.
  const seen = new Map();
  for (const r of labeled) {
    if (seen.has(r.label)) {
      throw new Error(`Layout.sketch: duplicate cell name "${r.label}" — if you meant to span, ensure the cells share a border with no divider between them`);
    }
    seen.set(r.label, r);
  }

  // Tracks come from the SET of distinct cell-edges, not the gaps between
  // them. A canvas border row (which no region touches) is correctly
  // excluded from track count — it's implicit between tracks.
  //
  // Distinct (minY) sorted = row starts. Distinct (maxY) sorted = row ends.
  // They must pair 1:1, since every row-of-cells shares its top/bottom.
  const rowStarts = [...new Set(labeled.map(r => r.minY))].sort((a, b) => a - b);
  const rowEnds   = [...new Set(labeled.map(r => r.maxY))].sort((a, b) => a - b);
  const colStarts = [...new Set(labeled.map(r => r.minX))].sort((a, b) => a - b);
  const colEnds   = [...new Set(labeled.map(r => r.maxX))].sort((a, b) => a - b);
  if (rowStarts.length !== rowEnds.length) {
    throw new Error('Layout.sketch: row edges do not align — every row-of-cells must share top/bottom borders');
  }
  if (colStarts.length !== colEnds.length) {
    throw new Error('Layout.sketch: col edges do not align — every col-of-cells must share left/right borders');
  }
  const rowTracks = rowStarts.map((start, i) => ({ start, end: rowEnds[i] }));
  const colTracks = colStarts.map((start, i) => ({ start, end: colEnds[i] }));

  // Map each cell to its track index range
  const cells = {};
  for (const r of labeled) {
    const rFirst = rowTracks.findIndex(t => t.start === r.minY);
    const rLast  = rowTracks.findIndex(t => t.end   === r.maxY);
    const cFirst = colTracks.findIndex(t => t.start === r.minX);
    const cLast  = colTracks.findIndex(t => t.end   === r.maxX);
    if (rFirst < 0 || rLast < 0 || cFirst < 0 || cLast < 0) {
      throw new Error(`Layout.sketch: cell "${r.label}" edges don't align with grid tracks — check for uneven borders`);
    }
    cells[r.label] = {
      row: rFirst === rLast ? rFirst : [rFirst, rLast],
      col: cFirst === cLast ? cFirst : [cFirst, cLast],
    };
  }

  // Track sizes proportional to drawn heights/widths → used as flex weights.
  const rows = rowTracks.map(t => `${t.end - t.start + 1}*`);
  const cols = colTracks.map(t => `${t.end - t.start + 1}*`);

  return { rows, cols, cells, border };
}
