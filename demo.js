#!/usr/bin/env node
// ─── lumina-cli demo ──────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────

async function demo() {

  process.stdout.write('\x1bc'); // clear
  write(ansi.hide());

  await sleep(200);

  // ── 1. Banner ────────────────────────────────────────────────────────

  banner('LUMINA', { color: 'chalk', char: '█', align: 'center' });
  writeln(`${c.slate}                 terminal ui toolkit · v1.0.0${c.r}`);
  writeln(`${c.graphite}                 zero dependencies · pure node.js${c.r}`);
  writeln();
  await sleep(600);

  // ── 2. Divider ───────────────────────────────────────────────────────

  divider({ label: 'SYSTEM', char: '─' });
  writeln();
  await sleep(300);

  // ── 3. Logger ────────────────────────────────────────────────────────

  header('logging', 'structured output at a glance');

  const syslog = createLogger({ prefix: 'sys', timestamps: true });
  syslog.info('Initializing runtime environment');
  await sleep(180);
  syslog.success('Node.js v22.0 detected');
  await sleep(180);
  syslog.warn('Memory pressure: 78% of available heap');
  await sleep(180);
  syslog.error('Failed to connect: redis://localhost:6379');
  await sleep(180);
  syslog.debug('Retry in 3000ms — attempt 1/3');
  writeln();
  await sleep(400);

  // ── 4. Spinners showcase ──────────────────────────────────────────────

  divider({ label: 'SPINNERS', char: '─' });
  writeln();
  header('loading animations', '12 handcrafted sequences');

  const spinnerTypes = [
    { type: 'braille',  text: 'braille wave — classic, refined',   color: 'chalk',    dur: 1600 },
    { type: 'block',    text: 'block build — brutalist momentum',   color: 'signal',   dur: 1800 },
    { type: 'dash',     text: 'dash wave — horizontal rhythm',      color: 'azure',    dur: 2200 },
    { type: 'orbital',  text: 'orbital — clean circular motion',    color: 'lavender', dur: 1400 },
    { type: 'pulse',    text: 'pulse — slow breath, alive',         color: 'sage',     dur: 2200 },
    { type: 'grid',     text: 'grid — IBM heritage, systematic',    color: 'amber',    dur: 1600 },
    { type: 'triangle', text: 'triangle — sharp, angular energy',   color: 'signal',   dur: 1400 },
    { type: 'morph',    text: 'morph — shape-shifts, restless',     color: 'lavender', dur: 1600 },
    { type: 'snake',    text: 'snake — hypnotic braille river',     color: 'azure',    dur: 1800 },
    { type: 'signal',   text: 'signal — morse, radio tower',        color: 'chalk',    dur: 2400 },
    { type: 'cross',    text: 'cross — swiss grid, geometric',      color: 'amber',    dur: 1800 },
  ];

  for (const s of spinnerTypes) {
    const sp = new Spinner({ type: s.type, text: s.text, color: s.color });
    sp.start();
    await sleep(s.dur);
    sp.succeed(s.text);
    await sleep(80);
  }
  writeln();

  // ── 5. Multi-spinner ──────────────────────────────────────────────────

  divider({ label: 'PARALLEL', char: '─' });
  writeln();
  header('multi-spinner', 'concurrent tasks at a glance');

  const multi = new MultiSpinner();
  const i0 = multi.add({ type: 'braille',  text: 'Compiling TypeScript sources',     color: 'azure'    });
  const i1 = multi.add({ type: 'dash',     text: 'Bundling assets with esbuild',     color: 'lavender' });
  const i2 = multi.add({ type: 'grid',     text: 'Running test suite (247 specs)',   color: 'chalk'    });
  const i3 = multi.add({ type: 'pulse',    text: 'Uploading dist to CDN edge nodes', color: 'sage'     });
  const i4 = multi.add({ type: 'triangle', text: 'Invalidating CloudFront cache',    color: 'amber'    });

  multi.start();

  await sleep(1200);  multi.succeed(i0, 'TypeScript compiled — 0 errors');
  await sleep(700);   multi.succeed(i1, 'Bundle: 48.2KB (gzip: 14.1KB)');
  await sleep(1100);  multi.fail(i2,    'Test suite: 3 failures detected');
  await sleep(600);   multi.succeed(i3, 'CDN upload complete (12 PoPs)');
  await sleep(900);   multi.warn(i4,    'Cache invalidation: partial (EU)');
  await sleep(500);

  multi.stop();
  writeln();
  await sleep(400);

  // ── 6. Progress bars ──────────────────────────────────────────────────

  divider({ label: 'PROGRESS', char: '─' });
  writeln();
  header('progress bars', '6 distinct visual styles');

  const barDefs = [
    { style: 'block',     color: 'chalk',    label: 'block    ' },
    { style: 'shaded',    color: 'azure',    label: 'shaded   ' },
    { style: 'bracket',   color: 'lavender', label: 'bracket  ' },
    { style: 'thin',      color: 'sage',     label: 'thin     ' },
    { style: 'brutalist', color: 'signal',   label: 'brutalist' },
    { style: 'dots',      color: 'amber',    label: 'dots     ' },
  ];

  for (const def of barDefs) {
    const bar = new ProgressBar({ total: 40, style: def.style, color: def.color, label: def.label });
    bar.start();
    for (let i = 0; i <= 40; i++) {
      bar.update(i);
      await sleep(18);
    }
    bar.complete();
    await sleep(60);
  }
  writeln();
  await sleep(300);

  // ── 7. Multi-bar ──────────────────────────────────────────────────────

  header('multi-bar', 'simultaneous downloads / uploads');

  const mb = new MultiBar();
  const b0 = mb.add({ total: 100, style: 'block',  color: 'azure',    label: 'kernel.img    ' });
  const b1 = mb.add({ total: 100, style: 'shaded', color: 'lavender', label: 'node_modules/ ' });
  const b2 = mb.add({ total: 100, style: 'thin',   color: 'sage',     label: 'assets.tar.gz ' });
  mb.start();

  for (let t = 0; t <= 100; t++) {
    mb.update(b0, t);
    mb.update(b1, Math.min(100, Math.round(t * 0.7)));
    mb.update(b2, Math.min(100, Math.round(t * 1.3)));
    mb.tick();
    await sleep(22);
  }
  mb.stop();
  writeln();
  await sleep(400);

  // ── 8. Boxes ─────────────────────────────────────────────────────────

  divider({ label: 'LAYOUT', char: '─' });
  writeln();
  header('boxes', 'structured content containers');

  box(
    [
      `${c.chalk}${c.b}Bauhaus meets the terminal.${c.r}`,
      '',
      `${c.fog}Form follows function. Every character serves a purpose.`,
      `No gradients, no glow — raw typographic precision.${c.r}`,
      '',
      `${c.slate}Version 1.0.0 · Zero dependencies · MIT License${c.r}`,
    ],
    { border: 'thick', color: 'chalk', title: 'LUMINA', padding: 2, width: 60 }
  );
  writeln();

  box('A minimal note.', { border: 'single', color: 'dim', padding: 1, width: 40 });
  writeln();

  box(
    `${c.signal}Critical failure in production${c.r}\n${c.fog}Service: api-gateway · Pod: prod-east-3b\nError: ECONNREFUSED redis://10.0.1.15:6379${c.r}`,
    { border: 'double', color: 'signal', title: 'ALERT', padding: 1, width: 55,
      footer: '2026-04-13 · 09:41:07 UTC' }
  );
  writeln();
  await sleep(200);

  // ── 9. Table ──────────────────────────────────────────────────────────

  header('table', 'data at a glance');

  const pkgData = [
    { package: 'lumina-cli',  version: '1.0.0', size: '0 B',    deps: 0,  license: 'MIT' },
    { package: 'chalk',       version: '5.3.0', size: '8.2 KB', deps: 0,  license: 'MIT' },
    { package: 'ora',         version: '8.1.0', size: '11 KB',  deps: 5,  license: 'MIT' },
    { package: 'cli-progress',version: '3.12.0',size: '18 KB',  deps: 1,  license: 'MIT' },
    { package: 'boxen',       version: '7.1.1', size: '22 KB',  deps: 9,  license: 'MIT' },
  ];

  table(pkgData, { border: 'single', color: 'default' });
  writeln();
  await sleep(200);

  // ── 10. Key-value log ─────────────────────────────────────────────────

  header('environment', 'deployment context');

  log
    .kv('NODE_ENV',       'production')
    .kv('REGION',         'ap-south-1 (Mumbai)')
    .kv('INSTANCE_TYPE',  'c6g.xlarge')
    .kv('MEMORY',         '7.8 GB / 8 GB (97%)')
    .kv('CPU',            '0.42 (4 vCPU)')
    .kv('UPTIME',         '14d 07h 33m')
    .kv('DEPLOY',         'v2.14.1 · 6 minutes ago');

  writeln();
  await sleep(200);

  // ── 11. Step sequence ─────────────────────────────────────────────────

  header('pipeline', 'ci/cd steps');

  const steps = [
    'Checkout repository @ main',
    'Restore dependency cache',
    'Install production dependencies',
    'Run lint & type checks',
    'Execute test suite',
    'Build production bundle',
    'Publish to npm registry',
    'Notify deployment webhook',
  ];

  for (let i = 0; i < steps.length; i++) {
    const sp = new Spinner({ type: 'braille', text: steps[i], color: 'dim' });
    sp.start();
    await sleep(300 + Math.random() * 400);
    sp.succeed(`${c.chalk}${steps[i]}${c.r}`);
    await sleep(60);
  }
  writeln();

  // ── 12. Final banner ──────────────────────────────────────────────────

  divider({ char: '─' });
  writeln();
  banner('DONE', { color: 'sage', align: 'center' });
  writeln(`${c.slate}            npm install lumina-cli${c.r}`);
  writeln(`${c.graphite}            github.com/you/lumina-cli${c.r}`);
  writeln();

  write(ansi.show());
}

demo().catch(e => {
  write(ansi.show());
  console.error(e);
  process.exit(1);
});
