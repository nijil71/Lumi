import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ansi,
  visibleLen,
  stripAnsi,
  truncate,
  charWidth,
  colorLevel,
} from '../src/ansi.js';

import { diff } from '../src/diff/index.js';
import { box } from '../src/box/index.js';

// ─── ansi helpers ─────────────────────────────────────────────────────────

test('ansi.up(0) emits empty string (no accidental 1-move)', () => {
  assert.equal(ansi.up(0), '');
  assert.equal(ansi.down(0), '');
  assert.equal(ansi.left(0), '');
  assert.equal(ansi.right(0), '');
});

test('ansi.up(n) for n>0 emits the escape code', () => {
  assert.equal(ansi.up(3), '\x1b[3A');
});

test('ansi.clearLine() returns cursor to col 1', () => {
  // Must clear *and* reset column so callers don't have to pair with col(1).
  assert.match(ansi.clearLine(), /\x1b\[2K/);
  assert.match(ansi.clearLine(), /\x1b\[1G/);
});

// ─── visibleLen ───────────────────────────────────────────────────────────

test('visibleLen: ASCII width is char count', () => {
  assert.equal(visibleLen('hello'), 5);
});

test('visibleLen: ANSI codes are stripped before measuring', () => {
  assert.equal(visibleLen('\x1b[31mred\x1b[0m'), 3);
});

test('visibleLen: CJK counts as 2 columns per char', () => {
  assert.equal(visibleLen('你好'), 4);
  assert.equal(visibleLen('한국'), 4);
});

test('visibleLen: emoji count as 2 columns', () => {
  assert.equal(visibleLen('🎉'), 2);
  assert.equal(visibleLen('a🎉b'), 4);
});

test('visibleLen: ZWJ sequence counts as one glyph', () => {
  // Family emoji = man + ZWJ + woman + ZWJ + girl (terminal renders as 2 cols)
  assert.equal(visibleLen('👨\u200d👩\u200d👧'), 2);
});

test('visibleLen: combining marks do not add width', () => {
  assert.equal(visibleLen('e\u0301'), 1); // é as e + combining acute
});

// ─── charWidth ────────────────────────────────────────────────────────────

test('charWidth: basic ranges', () => {
  assert.equal(charWidth(0x0041), 1);     // 'A'
  assert.equal(charWidth(0x4E2D), 2);     // 中
  assert.equal(charWidth(0x1F389), 2);    // 🎉
  assert.equal(charWidth(0x0300), 0);     // combining grave
  assert.equal(charWidth(0x200D), 0);     // ZWJ
});

// ─── stripAnsi ────────────────────────────────────────────────────────────

test('stripAnsi: strips SGR codes', () => {
  assert.equal(stripAnsi('\x1b[1;31mbold red\x1b[0m'), 'bold red');
});

test('stripAnsi: strips OSC hyperlink escape framing', () => {
  const linked = '\x1b]8;;https://example.com\x07click\x1b]8;;\x07';
  assert.equal(stripAnsi(linked), 'click');
});

// ─── truncate ─────────────────────────────────────────────────────────────

test('truncate: short strings are returned untouched', () => {
  assert.equal(truncate('hi', 10), 'hi');
});

test('truncate: ellipsis on ASCII', () => {
  assert.equal(truncate('hello world', 8), 'hello w…');
});

test('truncate: respects wide chars (CJK)', () => {
  // width budget 5 — 你好 is 4 cols, adding 世 would push to 6; stop at 你好.
  assert.equal(truncate('你好世界', 5), '你好…');
});

test('truncate: preserves ANSI codes and only emits reset when needed', () => {
  const plain = truncate('abcdefg', 4);
  // Plain text should NOT gain a reset code.
  assert.ok(!plain.includes('\x1b[0m'), 'no stray reset on plain string');
  assert.equal(plain, 'abc…');

  const colored = truncate('\x1b[31mred text here\x1b[0m', 6);
  // Colored text should have a reset at the end.
  assert.ok(colored.endsWith('\x1b[0m'));
});

// ─── colorLevel ───────────────────────────────────────────────────────────

test('colorLevel: NO_COLOR disables color regardless of other env', () => {
  const prev = { ...process.env };
  try {
    process.env.NO_COLOR = '1';
    process.env.COLORTERM = 'truecolor';
    assert.equal(colorLevel(), 0);
  } finally {
    process.env = prev;
  }
});

test('colorLevel: FORCE_COLOR=2 forces 256', () => {
  const prev = { ...process.env };
  try {
    delete process.env.NO_COLOR;
    process.env.FORCE_COLOR = '2';
    assert.equal(colorLevel(), 2);
  } finally {
    process.env = prev;
  }
});

// ─── diff ─────────────────────────────────────────────────────────────────

test('diff: handles empty old text', () => {
  // Just make sure it doesn't throw and produces some output via writeln
  // (we're not capturing here — absence of exception is the test).
  assert.doesNotThrow(() => diff('', 'new\nlines'));
});

test('diff: handles identical text and reports no differences', () => {
  // Capture stdout to verify the "no differences" message is printed.
  const originalWrite = process.stdout.write;
  let out = '';
  process.stdout.write = function (chunk) {
    out += typeof chunk === 'string' ? chunk : chunk.toString();
    return true;
  };
  try {
    diff('a\nb\nc', 'a\nb\nc');
  } finally {
    process.stdout.write = originalWrite;
  }
  assert.match(stripAnsi(out), /no differences/);
});

test('diff: handles empty new text', () => {
  assert.doesNotThrow(() => diff('old\nlines', ''));
});

// ─── box word-wrap preserves ANSI ─────────────────────────────────────────

test('box: wraps long colored content without dropping color', async () => {
  // Capture output and assert that a colored word inside a box that wraps
  // retains its color code. Regression test for the silent "strip ANSI then
  // re-emit nothing" behaviour in the old box.
  const originalWrite = process.stdout.write;
  let out = '';
  process.stdout.write = function (chunk) {
    out += typeof chunk === 'string' ? chunk : chunk.toString();
    return true;
  };
  try {
    const colored = '\x1b[31mthisisaverylongcoloredwordthatshouldwrap\x1b[0m andmore';
    box(colored, { width: 20, border: 'ascii' });
  } finally {
    process.stdout.write = originalWrite;
  }
  // The red escape must still appear somewhere in the output after wrap.
  assert.match(out, /\x1b\[31m/);
});
