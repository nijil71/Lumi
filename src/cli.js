#!/usr/bin/env node

import { readFile, stat } from 'node:fs/promises';
import {
  banner, c, writeln,
  gradient, GRADIENTS, cols, visibleLen,
} from './index.js';

async function getVersion() {
  const pkgUrl = new URL('../package.json', import.meta.url);
  const pkg = JSON.parse(await readFile(pkgUrl, 'utf8'));
  return pkg.version;
}

/** Bundle size — read live from dist/ so it never goes stale. */
async function getBundleSize() {
  try {
    const distUrl = new URL('../dist/index.js', import.meta.url);
    const s = await stat(distUrl);
    return `${Math.round(s.size / 1024)} kB`;
  } catch {
    return null;
  }
}

// ─── Each "browse" command gets a 1-char thumbnail so the help screen is
//     visually grouped and scannable at a glance.
const BROWSE = [
  ['⣿',  'demo',             'full cinematic showcase'],
  ['⠏',  'demo spinners',    '25 types + 11 pets'],
  ['▮',  'demo progress',    'bars · multi · ETA + rate'],
  ['▤',  'demo layout',      'sketch-driven dashboard'],
  ['◼',  'demo boxes',       'borders + columns'],
  ['▦',  'demo table',       'aligned · truncated'],
  ['▁▃▇','demo sparklines',  'inline unicode charts'],
  ['⌞',  'demo tree',        'nested trees'],
  ['±',  'demo diff',        'line-by-line colored diff'],
  ['▬',  'demo statusbar',   'pinned status line'],
  ['L',  'demo logger',      '5 log levels + kv'],
  ['◆',  'demo banner',      'block-letter ASCII banners'],
];

const INTERACTIVE = [
  ['❯',  'demo prompts',     'input · select · multi · autocomplete'],
  ['≡',  'demo pager',       'alt-screen paginator (like less)'],
];

const MODIFIERS = [
  ['--slow',  'longer pauses — presentation mode'],
  ['--fast',  'shortened pauses — skim mode'],
];

const INFO = [
  ['--help',    'show this screen'],
  ['--version', 'print version'],
];

function renderRow(thumb, cmd, desc, thumbW, cmdW) {
  const t = padVis(thumb, thumbW);
  const k = padVis(cmd,   cmdW);
  writeln(`  ${c.lavender}${t}${c.r}  ${c.chalk}${k}${c.r}  ${c.slate}${desc}${c.r}`);
}

function padVis(s, w) {
  const pad = Math.max(0, w - visibleLen(s));
  return s + ' '.repeat(pad);
}

function centered(text) {
  const gap = Math.max(0, Math.floor((cols() - visibleLen(text)) / 2));
  return ' '.repeat(gap) + text;
}

function sectionHeader(label) {
  writeln();
  writeln(`  ${c.d}${c.b}${label}${c.r}`);
  writeln();
}

async function printHelp(version) {
  const w = cols();
  const compact = w < 60;

  // ─── banner + metadata strip ─────────────────────────────────────────
  writeln();
  banner('LUMI', { gradient: GRADIENTS.neon, align: 'center', gap: 1 });
  writeln(centered(`${c.slate}terminal ui toolkit · v${version}${c.r}`));

  const size = await getBundleSize();
  const meta = [size, '0 dependencies', 'node ≥18'].filter(Boolean).join(' · ');
  writeln(centered(`${c.d}${meta}${c.r}`));
  writeln();
  writeln(centered(gradient('─'.repeat(Math.min(40, w - 4)), ...GRADIENTS.neon)));

  // ─── command groups ──────────────────────────────────────────────────
  const thumbW = Math.max(...[...BROWSE, ...INTERACTIVE].map(([t]) => visibleLen(t)));
  const cmdW   = Math.max(...[...BROWSE, ...INTERACTIVE].map(([, k]) => visibleLen(k)));

  sectionHeader('BROWSE');
  for (const [thumb, cmd, desc] of BROWSE) renderRow(thumb, cmd, desc, thumbW, cmdW);

  sectionHeader('INTERACTIVE');
  writeln(`  ${c.d}takes over the terminal · Ctrl+C or q to exit${c.r}`);
  writeln();
  for (const [thumb, cmd, desc] of INTERACTIVE) renderRow(thumb, cmd, desc, thumbW, cmdW);

  sectionHeader('MODIFIERS');
  const modW = Math.max(...MODIFIERS.map(([k]) => visibleLen(k)));
  for (const [flag, desc] of MODIFIERS) {
    writeln(`  ${c.lavender}${padVis(flag, modW)}${c.r}  ${c.slate}${desc}${c.r}`);
  }

  sectionHeader('INFO');
  const infoW = Math.max(...INFO.map(([k]) => visibleLen(k)));
  for (const [flag, desc] of INFO) {
    writeln(`  ${c.lavender}${padVis(flag, infoW)}${c.r}  ${c.slate}${desc}${c.r}`);
  }

  // ─── final call-to-action ────────────────────────────────────────────
  writeln();
  writeln();
  const cta = 'npx lumi demo';
  const arrow = '  ❯  ';
  const line = `${c.d}${arrow}${c.r}${gradient(cta, ...GRADIENTS.neon)}${c.d}  ← start here${c.r}`;
  const visible = visibleLen(stripAnsi(arrow + cta + '  ← start here'));
  const pad = Math.max(0, Math.floor((w - visible) / 2));
  writeln(' '.repeat(pad) + line);
  writeln();

  if (compact) {
    writeln(`  ${c.d}(terminal is narrow — resize for the intended layout)${c.r}`);
    writeln();
  }
}

// Local stripAnsi for length calc without importing it (small + inlined keeps help screen self-contained)
function stripAnsi(s) { return String(s).replace(/\x1b\[[\d;]*m|\x1b\][^\x07]*\x07/g, ''); }

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const version = await getVersion();

  switch (command) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      await printHelp(version);
      return;
    case 'version':
    case '--version':
    case '-v':
      process.stdout.write(`${version}\n`);
      return;
    case 'demo': {
      const demoArgs = args.slice(1);
      process.argv = [process.argv[0], process.argv[1], ...demoArgs];
      await import('../demo.js');
      return;
    }
    default:
      process.stderr.write(`Unknown command: ${command}\n`);
      process.stderr.write('Run "lumi --help" for usage.\n');
      process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
