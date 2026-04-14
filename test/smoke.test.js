import test from 'node:test';
import assert from 'node:assert/strict';

import {
  Spinner,
  MultiSpinner,
  ProgressBar,
  MultiBar,
  banner,
  box,
  table,
  divider,
  badge,
  log,
} from '../src/index.js';

async function captureStdout(run) {
  const originalWrite = process.stdout.write;
  let output = '';

  process.stdout.write = function write(chunk, encoding, callback) {
    const text = typeof chunk === 'string' ? chunk : chunk.toString(encoding || 'utf8');
    output += text;
    return originalWrite.call(this, chunk, encoding, callback);
  };

  try {
    await run();
    return output;
  } finally {
    process.stdout.write = originalWrite;
  }
}

test('exports render representative static components', async () => {
  const output = await captureStdout(async () => {
    banner('ok', { align: 'left' });
    divider({ label: 'TEST' });
    box('hello world', { border: 'ascii', width: 24 });
    table([{ name: 'alpha', status: 'ready' }], { border: 'minimal' });
    log.kv('PORT', '3000');
    process.stdout.write(`${badge('v1.0.0')}\n`);
  });

  assert.match(output, /hello world/);
  assert.match(output, /alpha/);
  assert.match(output, /PORT/);
  assert.match(output, /v1\.0\.0/);
});

test('interactive primitives complete without throwing', async () => {
  const output = await captureStdout(async () => {
    // Spinner — in non-TTY mode, prints final state only
    const spinner = new Spinner({ text: 'Loading' });
    spinner.start();
    await new Promise((resolve) => setTimeout(resolve, 20));
    spinner.succeed('Done');

    // MultiSpinner — non-TTY prints final states on stop()
    const multiSpinner = new MultiSpinner();
    const step = multiSpinner.add({ text: 'Compiling' });
    multiSpinner.start();
    multiSpinner.succeed(step, 'Compiled');
    multiSpinner.stop();

    // ProgressBar — non-TTY prints milestone percentages
    const bar = new ProgressBar({ total: 3, label: 'build' });
    bar.start();
    bar.update(2);
    bar.complete('Built');

    // MultiBar — non-TTY mode skips rendering
    const multiBar = new MultiBar();
    multiBar.add({ total: 5, label: 'assets' });
    multiBar.start();
    multiBar.stop();
  });

  assert.match(output, /Done/);
  assert.match(output, /Compiled/);
  assert.match(output, /Built/);
  assert.match(output, /build/);
});
