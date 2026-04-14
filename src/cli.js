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
  writeln(`${c.slate}  terminal ui toolkit · v${version}${c.r}`);
  writeln();
  divider({ label: 'COMMANDS' });
  writeln();
  writeln(`  ${c.chalk}lumina demo${c.r}               run full showcase`);
  writeln(`  ${c.chalk}lumina demo spinners${c.r}      just spinners`);
  writeln(`  ${c.chalk}lumina demo progress${c.r}      just progress bars`);
  writeln(`  ${c.chalk}lumina demo boxes${c.r}         just boxes`);
  writeln(`  ${c.chalk}lumina demo table${c.r}         just table`);
  writeln(`  ${c.chalk}lumina demo logger${c.r}        just logger`);
  writeln(`  ${c.chalk}lumina demo badges${c.r}        just badges`);
  writeln(`  ${c.chalk}lumina demo --slow${c.r}        presentation mode`);
  writeln();
  writeln(`  ${c.chalk}lumina --help${c.r}             show this help`);
  writeln(`  ${c.chalk}lumina --version${c.r}          print version`);
  writeln();
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
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
    case 'demo': {
      // Pass remaining args to demo.js
      const demoArgs = args.slice(1);
      // Re-set process.argv so demo.js can read section names
      process.argv = [process.argv[0], process.argv[1], ...demoArgs];
      await import('../demo.js');
      return;
    }
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
