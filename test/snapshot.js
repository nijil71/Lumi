import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { stripAnsi } from '../src/ansi.js';

const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === '1';

export function matchSnapshot(name, content, dir = 'snapshots') {
  const file = join(process.cwd(), 'test', dir, `${name}.txt`);
  const stripped = stripAnsi(content);

  if (UPDATE_SNAPSHOTS) {
    try { mkdirSync(join(process.cwd(), 'test', dir), { recursive: true }); } catch (e) {}
    writeFileSync(file, stripped, 'utf-8');
    return true;
  }

  let existing = '';
  try {
    existing = readFileSync(file, 'utf-8');
  } catch (err) {
    throw new Error(`Snapshot \u001b[33m${name}\u001b[0m not found. Run with UPDATE_SNAPSHOTS=1 to generate.`);
  }

  if (existing !== stripped) {
    throw new Error(`Snapshot \u001b[31m${name}\u001b[0m mismatched.`);
  }

  return true;
}
