#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { banner, divider, c, writeln } from './index.js';

async function getVersion() {
  const pkgUrl = new URL('../package.json', import.meta.url);
  const pkg = JSON.parse(await readFile(pkgUrl, 'utf8'));
  return pkg.version;
}

function printHelp(version) {
  banner('LUMINA', { color: 'chalk', align: 'center' });
  writeln(`${c.slate}terminal ui toolkit · v${version}${c.r}`);
  writeln(`${c.graphite}zero runtime dependencies · pure node.js${c.r}`);
  writeln();
  divider({ label: 'COMMANDS' });
  writeln();
  writeln(`${c.chalk}lumina demo${c.r}      run the interactive showcase`);
  writeln(`${c.chalk}lumina --help${c.r}    show this help`);
  writeln(`${c.chalk}lumina --version${c.r} print the package version`);
  writeln();
}

async function main() {
  const command = process.argv[2];
  const version = await getVersion();

  switch (command) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      printHelp(version);
      return;
    case 'version':
    case '--version':
    case '-v':
      process.stdout.write(`${version}\n`);
      return;
    case 'demo':
      await import('../demo.js');
      return;
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      process.stderr.write('Run "lumina --help" for usage.\n');
      process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
