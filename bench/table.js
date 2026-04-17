import { performance } from 'node:perf_hooks';
import { table } from '../src/index.js';

const rows = 10000;
const data = Array.from({ length: rows }, (_, i) => ({
  id: String(i),
  name: `User Name ${i}`,
  email: `user${i}@example.com`,
  score: Math.random().toFixed(2)
}));

const originalWrite = process.stdout.write;
process.stdout.write = () => true;

const start = performance.now();
table(data);

process.stdout.write = originalWrite;
const ms = performance.now() - start;

console.log(`Table benchmark: Rendered ${rows} rows in ${ms.toFixed(2)}ms`);
