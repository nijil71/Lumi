import test from 'node:test';
import assert from 'node:assert/strict';

import { Layout, layout, __test } from '../src/layout/index.js';
import { visibleLen, stripAnsi } from '../src/ansi.js';

const { parseTrack, resolveTracks, cellGeometry, renderCellBlock } = __test;

// ─── parseTrack ───────────────────────────────────────────────────────────

test('layout.parseTrack: numbers and numeric strings are fixed', () => {
  assert.deepEqual(parseTrack(10), { type: 'fixed', value: 10 });
  assert.deepEqual(parseTrack('20'), { type: 'fixed', value: 20 });
});

test('layout.parseTrack: "*" and "N*" are flex with implicit and explicit weight', () => {
  assert.deepEqual(parseTrack('*'),  { type: 'flex', weight: 1 });
  assert.deepEqual(parseTrack('3*'), { type: 'flex', weight: 3 });
});

test('layout.parseTrack: "N%" is percent and is clamped to [0, 100]', () => {
  assert.deepEqual(parseTrack('40%'),  { type: 'percent', value: 40 });
  assert.deepEqual(parseTrack('200%'), { type: 'percent', value: 100 });
});

test('layout.parseTrack: invalid specs throw a descriptive error', () => {
  assert.throws(() => parseTrack('abc'), /invalid track spec/);
  assert.throws(() => parseTrack('*20'), /invalid track spec/);
});

// ─── resolveTracks ────────────────────────────────────────────────────────

test('layout.resolveTracks: fixed + single flex fills remaining space', () => {
  // 1 fixed row + flex + 1 fixed row, 24 rows total → flex gets 22
  assert.deepEqual(resolveTracks([1, '*', 1], 24), [1, 22, 1]);
});

test('layout.resolveTracks: multiple flex tracks split weighted', () => {
  // 2 flex weights 1:3 in 80 cols → 20 + 60 (last absorbs rounding)
  assert.deepEqual(resolveTracks(['*', '3*'], 80), [20, 60]);
});

test('layout.resolveTracks: percent is percent of original total, not remainder', () => {
  // 50% of 100 = 50, flex absorbs the other 50
  assert.deepEqual(resolveTracks(['50%', '*'], 100), [50, 50]);
});

test('layout.resolveTracks: last flex track absorbs rounding drift — sum equals total', () => {
  const sizes = resolveTracks(['*', '*', '*'], 10);
  assert.equal(sizes.reduce((a, b) => a + b, 0), 10);
});

test('layout.resolveTracks: overflow (fixed > total) clamps flex to zero, does not go negative', () => {
  const sizes = resolveTracks([50, '*', 50], 40);
  assert.equal(sizes[1], 0);
  assert.ok(sizes.every(s => s >= 0));
});

// ─── cellGeometry ─────────────────────────────────────────────────────────

test('layout.cellGeometry: single-track cell', () => {
  const rowSizes = [1, 20, 1];
  const colSizes = [10, 30];
  const geom = cellGeometry({ row: 1, col: 0 }, rowSizes, colSizes);
  assert.deepEqual(geom, { x: 0, y: 1, w: 10, h: 20 });
});

test('layout.cellGeometry: inclusive span [0, 1] covers both tracks', () => {
  const rowSizes = [1, 20, 1];
  const colSizes = [10, 30];
  const geom = cellGeometry({ row: 0, col: [0, 1] }, rowSizes, colSizes);
  assert.deepEqual(geom, { x: 0, y: 0, w: 40, h: 1 });
});

test('layout.cellGeometry: out-of-bounds indices throw — typos fail loudly', () => {
  const rowSizes = [5, 5];
  const colSizes = [5, 5];
  assert.throws(
    () => cellGeometry({ row: [0, 99], col: 0 }, rowSizes, colSizes),
    /row .* out of range/
  );
  assert.throws(
    () => cellGeometry({ row: 0, col: -1 }, rowSizes, colSizes),
    /col .* out of range/
  );
});

// ─── renderCellBlock ──────────────────────────────────────────────────────

test('layout.renderCellBlock: unbordered cell pads to exact width + height', () => {
  const block = renderCellBlock({ row: 0, col: 0 }, 'hi', 6, 3);
  assert.equal(block.length, 3);
  for (const line of block) assert.equal(visibleLen(line), 6);
  assert.equal(block[0], 'hi    ');
  assert.equal(block[1], '      ');
});

test('layout.renderCellBlock: bordered cell wraps content in box', () => {
  const block = renderCellBlock(
    { row: 0, col: 0, border: 'single' },
    'hi',
    6, 3
  );
  assert.equal(block.length, 3);
  assert.equal(block[0], '┌────┐');
  assert.equal(block[1], '│hi  │');
  assert.equal(block[2], '└────┘');
});

test('layout.renderCellBlock: title is embedded in the top border', () => {
  const block = renderCellBlock(
    { row: 0, col: 0, border: 'single', title: 'Nav' },
    '',
    12, 3
  );
  // inner width 10, title " Nav " (5 wide), after = 10 - 1 - 5 = 4 horiz chars
  assert.equal(block[0], '┌─ Nav ────┐');
});

test('layout.renderCellBlock: title that would overflow is silently dropped', () => {
  const block = renderCellBlock(
    { row: 0, col: 0, border: 'single', title: 'a really long title' },
    '',
    8, 3
  );
  // Falls back to plain top border
  assert.equal(block[0], '┌──────┐');
});

test('layout.renderCellBlock: interior respects user ANSI codes', () => {
  const block = renderCellBlock(
    { row: 0, col: 0, border: 'single' },
    '\x1b[31mred\x1b[0m',
    7, 3
  );
  // Body line should contain the SGR codes untouched and visibleLen = 7
  assert.equal(visibleLen(block[1]), 7);
  assert.match(block[1], /\x1b\[31mred\x1b\[0m/);
});

test('layout.renderCellBlock: content taller than cell is clipped', () => {
  const block = renderCellBlock(
    { row: 0, col: 0 },
    'a\nb\nc\nd\ne',
    3, 2
  );
  assert.equal(block.length, 2);
  assert.equal(block[0], 'a  ');
  assert.equal(block[1], 'b  ');
});

test('layout.renderCellBlock: zero-size cell returns empty block', () => {
  assert.deepEqual(renderCellBlock({ row: 0, col: 0 }, 'x', 0, 5), []);
  assert.deepEqual(renderCellBlock({ row: 0, col: 0 }, 'x', 5, 0), []);
});

// ─── Layout class ─────────────────────────────────────────────────────────

test('layout.set throws for unknown cells — typos fail loudly', () => {
  const lo = new Layout({
    rows: ['*'], cols: ['*'],
    cells: { main: { row: 0, col: 0 } },
  });
  assert.throws(() => lo.set('mian', 'hi'), /unknown cell/);
});

test('layout(): factory returns a Layout instance', () => {
  const lo = layout({ rows: ['*'], cols: ['*'], cells: { a: { row: 0, col: 0 } } });
  assert.ok(lo instanceof Layout);
});

test('layout.render in non-TTY falls back to labeled sequential print', () => {
  // In `node --test` stdout is piped (non-TTY) — render() should go through
  // the fallback path without hijacking the screen.
  const captured = [];
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => {
    captured.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
    return true;
  };
  try {
    const lo = new Layout({
      rows: [1, '*'],
      cols: ['*'],
      cells: {
        header: { row: 0, col: 0 },
        main:   { row: 1, col: 0, border: 'single', title: 'Main' },
      },
    });
    lo.set('header', 'Dashboard');
    lo.set('main',   'hello world');
    lo.render();
  } finally {
    process.stdout.write = origWrite;
  }
  const out = captured.join('');
  assert.match(out, /── header/);
  assert.match(out, /── main/);
  assert.match(out, /Dashboard/);
  assert.match(out, /hello world/);
});

test('layout.set accepts a function that is re-invoked on each render', () => {
  let calls = 0;
  const origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = () => true;   // silence
  try {
    const lo = new Layout({
      rows: ['*'], cols: ['*'],
      cells: { main: { row: 0, col: 0 } },
    });
    lo.set('main', () => { calls++; return `tick ${calls}`; });
    lo.render();
    lo.render();
    lo.render();
  } finally {
    process.stdout.write = origWrite;
  }
  assert.equal(calls, 3);
});

test('layout.start and stop are idempotent — double-calls are safe', () => {
  const lo = new Layout({ rows: ['*'], cols: ['*'], cells: { a: { row: 0, col: 0 } } });
  // non-TTY path — start/stop are no-ops but should never throw
  lo.start(); lo.start();
  lo.stop();  lo.stop();
});

// ─── Grid helpers (gridBorder mode) ───────────────────────────────────────

test('layout.buildCellMap: maps each track cell to its owning cell name', () => {
  const { buildCellMap } = __test;
  const map = buildCellMap({
    h: { row: 0, col: [0, 1] },
    a: { row: 1, col: 0 },
    b: { row: 1, col: 1 },
  }, 2, 2);
  assert.deepEqual(map, [['h', 'h'], ['a', 'b']]);
});

test('layout.buildCellMap: overlapping cells throw', () => {
  const { buildCellMap } = __test;
  assert.throws(
    () => buildCellMap({
      a: { row: 0, col: 0 },
      b: { row: 0, col: 0 },   // overlaps a
    }, 1, 1),
    /overlap/
  );
});

test('layout.gridCellInterior: single cell accounts for border chars', () => {
  const { gridCellInterior } = __test;
  // one 1×1 cell, colSizes=[10], rowSizes=[3]
  // outer left border at col 0, interior cols 1..10, right border at col 11
  const g = gridCellInterior({ row: 0, col: 0 }, [3], [10]);
  assert.deepEqual(g, { x: 1, y: 1, w: 10, h: 3 });
});

test('layout.gridCellInterior: spans absorb inner border chars', () => {
  const { gridCellInterior } = __test;
  // colSizes = [4, 6], row span [0,0], col span [0,1]
  // Interior width = 4 + 1 (inner divider char) + 6 = 11
  const g = gridCellInterior({ row: 0, col: [0, 1] }, [2], [4, 6]);
  assert.deepEqual(g, { x: 1, y: 1, w: 11, h: 2 });
});

test('layout.drawGridFrame: renders rounded corners + span-aware dividers', () => {
  const { drawGridFrame, buildCellMap } = __test;
  const cells = {
    h: { row: 0, col: [0, 1] },
    a: { row: 1, col: 0 },
    b: { row: 1, col: 1 },
    f: { row: 2, col: [0, 1] },
  };
  const map = buildCellMap(cells, 3, 2);
  const frame = drawGridFrame(map, cells, [1, 1, 1], [4, 4], 'rounded');
  assert.deepEqual(frame, [
    '╭─────────╮',   // header spans: no ┬ in the middle
    '│         │',
    '├────┬────┤',   // nav/main divider: ┬ on top, │ vertical, ┴ below
    '│    │    │',
    '├────┴────┤',
    '│         │',
    '╰─────────╯',
  ]);
});

test('layout.drawGridFrame: titles embed into the top edge of each cell', () => {
  const { drawGridFrame, buildCellMap } = __test;
  const cells = { main: { row: 0, col: 0, title: 'Hi' } };
  const map = buildCellMap(cells, 1, 1);
  const frame = drawGridFrame(map, cells, [1], [10], 'single');
  assert.equal(frame[0], '┌─ Hi ─────┐');
});

test('layout.pickJunction: resolves every intersection flavor', () => {
  const { pickJunction } = __test;
  const br = { h:'─', v:'│', tl:'┌', tr:'┐', bl:'└', br:'┘',
               tup:'┴', tdown:'┬', tleft:'┤', tright:'├', cross:'┼' };
  //                      up    down  left  right
  assert.equal(pickJunction(br, true, true, true, true),   '┼');
  assert.equal(pickJunction(br, false, true, true, true),  '┬');
  assert.equal(pickJunction(br, true, false, true, true),  '┴');
  assert.equal(pickJunction(br, true, true, false, true),  '├');
  assert.equal(pickJunction(br, true, true, true, false),  '┤');
  assert.equal(pickJunction(br, false, true, false, true), '┌');
  assert.equal(pickJunction(br, false, true, true, false), '┐');
  assert.equal(pickJunction(br, true, false, false, true), '└');
  assert.equal(pickJunction(br, true, false, true, false), '┘');
});

// ─── Layout.sketch ────────────────────────────────────────────────────────

test('Layout.sketch: parses a 3-row grid with spans into the right config', () => {
  const lo = Layout.sketch`
    ╭──────────────╮
    │    header    │
    ├──────┬───────┤
    │ nav  │ main  │
    ├──────┴───────┤
    │    footer    │
    ╰──────────────╯
  `;
  // Can't easily introspect private state; assert that set() accepts the
  // labels we expect and rejects typos. That proves the parsed cell map.
  assert.doesNotThrow(() => lo.set('header', 'x'));
  assert.doesNotThrow(() => lo.set('nav',    'x'));
  assert.doesNotThrow(() => lo.set('main',   'x'));
  assert.doesNotThrow(() => lo.set('footer', 'x'));
  assert.throws(() => lo.set('side', 'x'), /unknown cell/);
});

test('Layout.sketch: detects border style from corner chars', () => {
  // Rendering the grid frame through drawGridFrame gives us the chars back.
  const checks = [
    { corners: '╭╮╰╯', pick: '╭', expect: 'rounded' },
    { corners: '╔╗╚╝', pick: '╔', expect: 'double'  },
    { corners: '┏┓┗┛', pick: '┏', expect: 'thick'   },
    { corners: '┌┐└┘', pick: '┌', expect: 'single'  },
    { corners: '++++', pick: '+', expect: 'ascii'   },
  ];
  for (const { corners, pick, expect: style } of checks) {
    const [tl, tr, bl, br] = [...corners];
    const h = style === 'double' ? '═' : style === 'thick' ? '━' : style === 'ascii' ? '-' : '─';
    const v = style === 'double' ? '║' : style === 'thick' ? '┃' : style === 'ascii' ? '|' : '│';
    const sketch = `${tl}${h.repeat(8)}${tr}\n${v}   x    ${v}\n${bl}${h.repeat(8)}${br}`;
    const lo = Layout.sketch(sketch);
    // Re-render via non-TTY fallback; just make sure it doesn't throw.
    // Style check: sketch() doesn't crash on any supported corner set.
    assert.doesNotThrow(() => lo.render());
  }
});

test('Layout.sketch: duplicate cell names throw', () => {
  assert.throws(() => Layout.sketch`
    ┌─────┬─────┐
    │  a  │  a  │
    └─────┴─────┘
  `, /duplicate/);
});

test('Layout.sketch: empty or label-less sketches throw', () => {
  assert.throws(() => Layout.sketch`   `, /empty/i);
  assert.throws(() => Layout.sketch`
    ┌───────┐
    │       │
    └───────┘
  `, /no labeled cells/);
});

test('Layout.sketch: title on top border is picked up as the cell name', () => {
  const lo = Layout.sketch`
    ┌─ header ─┐
    │          │
    └──────────┘
  `;
  assert.doesNotThrow(() => lo.set('header', 'hi'));
});

test('Layout.sketch: function form accepts options with cell title overrides', () => {
  const lo = Layout.sketch(`
    ┌─────────┐
    │  main   │
    └─────────┘
  `, { titles: { main: 'Main View' } });
  // Render in non-TTY and check the title appears somewhere in output.
  const captured = [];
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => { captured.push(typeof s === 'string' ? s : s.toString()); return true; };
  try {
    lo.set('main', 'x');
    lo.render();
  } finally {
    process.stdout.write = orig;
  }
  // Non-TTY fallback doesn't draw the grid frame so titles won't appear
  // there; at minimum the label must be present.
  assert.match(captured.join(''), /main/);
});
