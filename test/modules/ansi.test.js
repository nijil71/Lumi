import test from 'node:test';
import { strict as assert } from 'node:assert';
import { visibleLen, truncate, stripAnsi } from '../../src/ansi.js';
import { matchSnapshot } from '../snapshot.js';

test('ansi: visibleLen, truncate, stripAnsi', () => {
  const cases = [
    'hello world',
    '\x1b[31mred text\x1b[0m',
    'hello \x1b[1mbold\x1b[0m world',
    '₍ᐢ•ﻌ•ᐢ₎ 🥕',
    'こんにちは'
  ];

  let output = '';
  for (const c of cases) {
    output += `Raw: ${c}\n`;
    output += `Stripped: ${stripAnsi(c)}\n`;
    output += `Visible Len: ${visibleLen(c)}\n`;
    output += `Truncated (5): ${truncate(c, 5)}\n`;
    output += `Truncated (10): ${truncate(c, 10)}\n\n`;
  }

  assert.ok(matchSnapshot('ansi_utils', output));
});
