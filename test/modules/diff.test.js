import test from 'node:test';
import { strict as assert } from 'node:assert';
import { diff } from '../../src/index.js';
import { matchSnapshot } from '../snapshot.js';

test('diff: basic multiline with additions and deletions', () => {
  const oldText = 'line 1\nline 2\nline 3\nline 4';
  const newText = 'line 1\nchanged 2\nline 3\nadded 3.5\nline 4';

  let output = '';
  const originalWrite = process.stdout.write;
  process.stdout.write = (str) => { output += str; return true; };

  diff(oldText, newText);

  process.stdout.write = originalWrite;
  assert.ok(matchSnapshot('diff_basic', output));
});
