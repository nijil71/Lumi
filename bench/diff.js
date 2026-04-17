import { performance } from 'node:perf_hooks';
import { diff } from '../src/index.js';

const lines = 10000;
const a = Array.from({ length: lines }, (_, i) => `line ${i}`);
const b = [...a];
// introduce ~5% changes
for (let i = 0; i < lines; i += 20) {
  b[i] = `changed line ${i}`;
}

const aStr = a.join('\n');
const bStr = b.join('\n');

const start = performance.now();
// Diff writes to console, but we just want to benchmark the computeDiff internal logic primarily.
// Since `diff` calls `writeln`, we temporarily mock process.stdout.write
const originalWrite = process.stdout.write;
process.stdout.write = () => true;

diff(aStr, bStr);

process.stdout.write = originalWrite;
const ms = performance.now() - start;

console.log(`Diff benchmark: ${lines} lines ~5% changes completed in ${ms.toFixed(2)}ms`);
