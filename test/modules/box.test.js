import test from 'node:test';
import { strict as assert } from 'node:assert';
import { box } from '../../src/index.js';
import { matchSnapshot } from '../snapshot.js';

test('box: renders correctly with long wrapped text', () => {
  let output = '';
  const originalWrite = process.stdout.write;
  process.stdout.write = (str) => { output += str; return true; };

  box('This is a very long text that must be wrapped inside the box boundaries cleanly without dropping ansi states or breaking the borders severely over multiple lines!', {
    width: 40,
    title: 'INFO',
    footer: 'v1.0'
  });

  process.stdout.write = originalWrite;
  assert.ok(matchSnapshot('box_wrap', output));
});
