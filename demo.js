#!/usr/bin/env node
// ─── lumi-cli demo ──────────────────────────────────────────────────────

import {
  banner, divider, header, badge,
  box, columns,
  table,
  Spinner, MultiSpinner, SPINNERS,
  ProgressBar, MultiBar,
  log, createLogger,
  c, ansi, writeln, write, cols,
} from './src/index.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const slow = process.argv.includes('--slow');
const pause = (ms) => slow ? sleep(ms) : sleep(Math.min(ms, 60));

// ─── Section runners ──────────────────────────────────────────────────────

async function demoBanner() {
  banner('lumi', { color: 'chalk', char: '█', align: 'center' });
  writeln(`${c.slate}  terminal ui toolkit · v1.0.0 · zero dependencies${c.r}`);
  writeln();
  await pause(400);
}

async function demoLogger() {
  divider({ label: 'LOGGER' });
  header('log levels');

  const syslog = createLogger({ prefix: 'sys', timestamps: true });
  syslog.info('Initializing runtime environment');
  await pause(120);
  syslog.success('Node.js detected');
  await pause(120);
  syslog.warn('Memory pressure: 78%');
  await pause(120);
  syslog.error('Connection refused: redis://localhost:6379');
  await pause(120);
  syslog.debug('Retry in 3000ms');
  writeln();

  header('key-value pairs');
  log
    .kv('NODE_ENV',      'production')
    .kv('REGION',        'ap-south-1')
    .kv('MEMORY',        '7.8 GB / 8 GB')
    .kv('UPTIME',        '14d 07h 33m');
  writeln();

  header('step sequence');
  const steps = ['Checkout', 'Install', 'Lint', 'Test', 'Build', 'Publish'];
  for (let i = 0; i < steps.length; i++) {
    log.step(i + 1, steps.length, steps[i]);
  }
  writeln();
}

async function demoSpinners() {
  divider({ label: 'SPINNERS' });
  header('12 animation types');

  const types = [
    { type: 'braille',  text: 'braille',  color: 'chalk',    dur: 1200 },
    { type: 'block',    text: 'block',     color: 'signal',   dur: 1400 },
    { type: 'dash',     text: 'dash',      color: 'azure',    dur: 1600 },
    { type: 'orbital',  text: 'orbital',   color: 'lavender', dur: 1000 },
    { type: 'pulse',    text: 'pulse',     color: 'sage',     dur: 1600 },
    { type: 'grid',     text: 'grid',      color: 'amber',    dur: 1200 },
    { type: 'triangle', text: 'triangle',  color: 'signal',   dur: 1000 },
    { type: 'morph',    text: 'morph',     color: 'lavender', dur: 1200 },
    { type: 'snake',    text: 'snake',     color: 'azure',    dur: 1400 },
    { type: 'signal',   text: 'signal',    color: 'chalk',    dur: 1800 },
    { type: 'cross',    text: 'cross',     color: 'amber',    dur: 1200 },
    { type: 'clock',    text: 'clock',     color: 'sage',     dur: 1200 },
  ];

  for (const s of types) {
    const sp = new Spinner({ type: s.type, text: s.text, color: s.color, elapsed: true });
    sp.start();
    await sleep(slow ? s.dur : 600);
    sp.succeed(s.text);
    await pause(40);
  }
  writeln();
}

async function demoMultiSpinner() {
  header('multi-spinner');

  const multi = new MultiSpinner();
  const i0 = multi.add({ type: 'braille',  text: 'Compiling sources',     color: 'azure'    });
  const i1 = multi.add({ type: 'dash',     text: 'Bundling assets',       color: 'lavender' });
  const i2 = multi.add({ type: 'grid',     text: 'Running tests (247)',   color: 'chalk'    });
  const i3 = multi.add({ type: 'pulse',    text: 'Uploading to CDN',      color: 'sage'     });
  multi.start();

  await sleep(slow ? 1200 : 400); multi.succeed(i0, 'Compiled — 0 errors');
  await sleep(slow ? 700 : 300);  multi.succeed(i1, 'Bundle: 48.2KB gzip');
  await sleep(slow ? 1100 : 400); multi.fail(i2,    '3 test failures');
  await sleep(slow ? 600 : 300);  multi.succeed(i3, 'CDN upload complete');
  await sleep(slow ? 500 : 200);
  multi.stop();
  writeln();
}

async function demoProgress() {
  divider({ label: 'PROGRESS' });
  header('6 bar styles');

  const styles = [
    { style: 'block',     color: 'chalk',    label: 'block    ' },
    { style: 'shaded',    color: 'azure',    label: 'shaded   ' },
    { style: 'bracket',   color: 'lavender', label: 'bracket  ' },
    { style: 'thin',      color: 'sage',     label: 'thin     ' },
    { style: 'brutalist', color: 'signal',   label: 'brutalist' },
    { style: 'dots',      color: 'amber',    label: 'dots     ' },
  ];

  for (const def of styles) {
    const bar = new ProgressBar({ total: 40, style: def.style, color: def.color, label: def.label });
    bar.start();
    for (let i = 0; i <= 40; i++) {
      bar.update(i);
      await sleep(slow ? 18 : 5);
    }
    bar.complete();
    await pause(30);
  }
  writeln();
}

async function demoMultiBar() {
  header('multi-bar');

  const mb = new MultiBar();
  const b0 = mb.add({ total: 100, style: 'block',  color: 'azure',    label: 'kernel.img   ' });
  const b1 = mb.add({ total: 100, style: 'shaded', color: 'lavender', label: 'node_modules ' });
  const b2 = mb.add({ total: 100, style: 'thin',   color: 'sage',     label: 'assets.tar.gz' });
  mb.start();

  for (let t = 0; t <= 100; t++) {
    mb.update(b0, t);
    mb.update(b1, Math.min(100, Math.round(t * 0.7)));
    mb.update(b2, Math.min(100, Math.round(t * 1.3)));
    mb.tick();
    await sleep(slow ? 22 : 6);
  }
  mb.stop();
  writeln();
}

async function demoBoxes() {
  divider({ label: 'LAYOUT' });
  header('boxes');

  box(
    [
      `${c.chalk}${c.b}lumi-cli${c.r}`,
      '',
      `${c.fog}Terminal UI components with a consistent`,
      `color palette and zero runtime dependencies.${c.r}`,
      '',
      `${c.slate}v1.0.0 · MIT License${c.r}`,
    ],
    { border: 'thick', color: 'chalk', title: 'ABOUT', padding: 2, width: 55 }
  );
  writeln();

  box('Center-aligned content.', { border: 'rounded', color: 'azure', width: 40, align: 'center' });
  writeln();

  box(
    `Service: api-gateway\nError: ECONNREFUSED redis://10.0.1.15:6379`,
    { border: 'double', color: 'signal', title: 'ALERT', padding: 1, width: 50,
      footer: '2026-04-14 · 09:41 UTC' }
  );
  writeln();
}

async function demoTable() {
  header('table');

  table([
    { package: 'lumi-cli',   version: '1.0.0',  size: '~30KB', deps: 0, license: 'MIT' },
    { package: 'chalk',        version: '5.3.0',  size: '8.2KB', deps: 0, license: 'MIT' },
    { package: 'ora',          version: '8.1.0',  size: '11KB',  deps: 5, license: 'MIT' },
    { package: 'cli-progress', version: '3.12.0', size: '18KB',  deps: 1, license: 'MIT' },
    { package: 'boxen',        version: '7.1.1',  size: '22KB',  deps: 9, license: 'MIT' },
  ], {
    border: 'single',
    align: { deps: 'right', size: 'right' },
  });
  writeln();
}

async function demoBadges() {
  header('badges');

  writeln(`  ${badge('v1.0.0')}  ${badge('PASS', { type: 'success' })}  ${badge('FAIL', { type: 'error' })}  ${badge('WARN', { type: 'warning' })}  ${badge('INFO', { type: 'info' })}`);
  writeln();
}

// ─── Section registry ─────────────────────────────────────────────────────

const SECTIONS = {
  banner:    demoBanner,
  logger:    demoLogger,
  spinners:  demoSpinners,
  multi:     demoMultiSpinner,
  progress:  demoProgress,
  multibar:  demoMultiBar,
  boxes:     demoBoxes,
  table:     demoTable,
  badges:    demoBadges,
};

// ─── Main ─────────────────────────────────────────────────────────────────

async function demo() {
  // Determine which sections to run
  const args = process.argv.slice(2).filter(a => a !== '--slow');
  const requested = args.filter(a => SECTIONS[a]);

  process.stdout.write('\x1bc'); // clear screen
  write(ansi.hide());

  if (requested.length > 0) {
    for (const name of requested) {
      await SECTIONS[name]();
    }
  } else {
    // Run everything
    for (const fn of Object.values(SECTIONS)) {
      await fn();
    }
  }

  // Closing
  divider();
  banner('DONE', { color: 'sage', align: 'center' });
  writeln(`${c.slate}  npm install lumi-cli${c.r}`);
  writeln(`${c.graphite}  github.com/nijil71/Lumi${c.r}`);
  writeln();

  write(ansi.show());
}

demo().catch(e => {
  write(ansi.show());
  console.error(e);
  process.exit(1);
});
