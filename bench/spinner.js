import { performance } from 'node:perf_hooks';
import { spinner } from '../src/index.js';

// We want to measure the maximum redraw throughput.
// We'll mock process.stdout.write to just count frames.

const originalWrite = process.stdout.write;
let writes = 0;
process.stdout.write = () => { writes++; return true; };

// To test manual re-render throughput, we'll bypass the setInterval
// and just call `_render()` repeatedly. Note that this requires accessing a private method,
// but it's purely for benchmark/ceiling estimation.
const s = spinner('Benchmark spinner');
s._startMs = Date.now();

const iterations = 100000;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
  s._render();
}

const ms = performance.now() - start;
process.stdout.write = originalWrite;

const opsPerSec = (iterations / (ms / 1000)).toFixed(0);
console.log(`Spinner benchmark: ${opsPerSec} renders/sec`);
