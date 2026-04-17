#!/usr/bin/env node
// ─── lumi-cli demo ───────────────────────────────────────────────────────

import {
  banner, divider, header, badge,
  box, columns,
  table,
  Spinner, MultiSpinner, SPINNERS,
  ProgressBar, MultiBar,
  log, createLogger,
  c, ansi, writeln, write, cols, visibleLen,
  gradient, GRADIENTS,
  sparkline,
  tree,
  diff,
  StatusBar,
  confirm, select, input, multiSelect, autocomplete, TaskRunner, pager,
  Layout,
} from './src/index.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const slow = process.argv.includes('--slow');
const fast = process.argv.includes('--fast');
const pause = (ms) => fast ? sleep(Math.min(ms, 15)) : slow ? sleep(ms) : sleep(Math.min(ms, 70));

// ─── Helpers ──────────────────────────────────────────────────────────────

async function typewriter(text, delay = 18) {
  for (const ch of text) {
    write(ch);
    await sleep(fast ? 2 : delay);
  }
  writeln();
}

function sectionDivider(label, gradientPreset = GRADIENTS.neon) {
  const w = Math.min(cols(), 88);
  writeln();
  writeln(gradient('━'.repeat(w), ...gradientPreset));
  writeln(`  ${c.slate}${c.b}${label}${c.r}`);
  writeln();
}

// ─── Splash ───────────────────────────────────────────────────────────────

async function splash() {
  process.stdout.write('\x1bc');
  write(ansi.hide());
  await sleep(fast ? 20 : 100);

  banner('LUMI', { gradient: GRADIENTS.neon, align: 'center', char: '█', gap: 2 });

  const w = cols();
  const label = 'terminal ui · zero deps';
  const tw = ' '.repeat(Math.max(0, Math.floor((w - visibleLen(label)) / 2)));
  write(`${tw}${c.slate}`);
  await typewriter(label, fast ? 3 : 20);
  writeln();

  const stats = [
    badge('30 KB', { type: 'default' }),
    badge('0 deps', { type: 'success' }),
    badge('Node ≥18', { type: 'info' }),
    badge('MIT', { type: 'default' }),
    badge('ESM', { type: 'warning' }),
  ];
  const statsStr = stats.join('  ');
  const sw = ' '.repeat(Math.max(0, Math.floor((w - visibleLen(statsStr)) / 2)));
  writeln(sw + statsStr);
  writeln();
  await pause(280);
}

// ─── Logger ───────────────────────────────────────────────────────────────

async function demoLogger() {
  sectionDivider('LOGGER');
  header('log levels', 'structured output with consistent palette');

  const syslog = createLogger({ prefix: 'sys', timestamps: true });
  syslog.info('Initializing runtime environment');
  await pause(80);
  syslog.success('Node.js v22.2.0 detected');
  await pause(80);
  syslog.warn('Memory pressure: 78% — consider increasing heap');
  await pause(80);
  syslog.error('Connection refused: redis://localhost:6379');
  await pause(80);
  syslog.debug('Retry scheduled in 3000ms');
  writeln();

  header('key-value pairs', 'aligned, monochrome, scannable');
  log
    .kv('NODE_ENV', 'production')
    .kv('REGION', 'ap-south-1')
    .kv('MEMORY', '7.8 GB / 8 GB')
    .kv('UPTIME', '14d 07h 33m')
    .kv('BUILD', 'a3f9c12')
    .kv('DEPLOYED', '2026-04-14 · 09:41 UTC');
  writeln();

  header('step sequences', 'numbered pipeline progress');
  const steps = ['Checkout', 'Install', 'Lint', 'Type-check', 'Test', 'Build', 'Publish'];
  for (let i = 0; i < steps.length; i++) {
    log.step(i + 1, steps.length, steps[i]);
    await pause(55);
  }
  writeln();
}

// ─── Spinners ─────────────────────────────────────────────────────────────

async function demoSpinners() {
  sectionDivider('SPINNERS', GRADIENTS.fire);
  header('25 animation types', 'every frame hand-crafted — including 11 action and multi-line pets');

  const types = [
    { type: 'braille', text: 'braille — classic dots', color: 'chalk', dur: 800 },
    { type: 'line', text: 'line — classic ASCII spin', color: 'chalk', dur: 700 },
    { type: 'arc', text: 'arc — half-circle sweep', color: 'azure', dur: 700 },
    { type: 'grid', text: 'grid — dense braille', color: 'amber', dur: 800 },
    { type: 'wave', text: 'wave — bar chart pulse', color: 'lavender', dur: 900 },
    { type: 'cyber', text: 'cyber — bit crawl', color: 'signal', dur: 800 },
    { type: 'snake', text: 'snake — rolling bits', color: 'azure', dur: 900 },
    { type: 'bounce', text: 'bounce — simple dot', color: 'chalk', dur: 800 },
    { type: 'fade', text: 'fade — grayscale block', color: 'slate', dur: 900 },
    { type: 'slash', text: 'slash — crossing bars', color: 'amber', dur: 800 },
    { type: 'grow', text: 'grow — expanding block', color: 'signal', dur: 1000 },
    { type: 'ripple', text: 'ripple — circular waves', color: 'azure', dur: 900 },
    { type: 'runner', text: 'runner — pacman run', color: 'amber', dur: 1200 },
    { type: 'heartbeat', text: 'heartbeat — pulsing love', color: 'signal', dur: 1000 },
  ];

  for (const s of types) {
    const sp = new Spinner({ type: s.type, text: s.text, color: s.color, elapsed: true });
    sp.start();
    await sleep(fast ? 180 : slow ? s.dur : 460);
    sp.succeed(s.text);
    await pause(25);
  }
  writeln();
}

// ─── Pet Spinners ─────────────────────────────────────────────────────────

async function demoPetSpinners() {
  header('pet spinners 🐾', 'action kaomojis and multi-line ASCII art — animated loading fun');

  const pets = [
    { type: 'catChase', text: 'Prowling through modules…', color: 'lavender', dur: 1800 },
    { type: 'dogFetch', text: 'Chasing down memory leaks…', color: 'amber', dur: 1800 },
    { type: 'bunnyEat', text: 'Fetching dependencies…', color: 'sage', dur: 1800 },
    { type: 'fishSwim', text: 'Streaming build artifacts…', color: 'azure', dur: 1800 },
    { type: 'bearHoney', text: 'Deploying to the cloud…', color: 'amber', dur: 1800 },
    { type: 'caterpillar', text: 'Patiently building assets…', color: 'sage', dur: 1800 },
    { type: 'catWalk', text: 'Stretching the multi-line cat…', color: 'lavender', dur: 2400 },
    { type: 'dogWag', text: 'Wagging the multi-line dog…', color: 'amber', dur: 2400 },
    { type: 'bunnyHop', text: 'Hopping the multi-line bunny…', color: 'sage', dur: 2400 },
    { type: 'birdFlap', text: 'Flapping the multi-line bird…', color: 'chalk', dur: 2400 },
    { type: 'turtleCrawl', text: 'Crawling the multi-line turtle…', color: 'sage', dur: 3000 },
  ];

  for (const pet of pets) {
    const sp = new Spinner({ type: pet.type, text: pet.text, color: pet.color, elapsed: true });
    sp.start();
    await sleep(fast ? 400 : slow ? pet.dur : 1200);
    sp.succeed(pet.text);
    await pause(60);
  }
  writeln();
}

async function demoMultiSpinner() {
  header('multi-spinner', 'run concurrent tasks — each resolves independently');

  const multi = new MultiSpinner();
  const i0 = multi.add({ type: 'braille', text: 'Compiling sources', color: 'azure' });
  const i1 = multi.add({ type: 'wave', text: 'Bundling assets', color: 'lavender' });
  const i2 = multi.add({ type: 'cyber', text: 'Running tests', color: 'chalk' });
  const i3 = multi.add({ type: 'runner', text: 'Uploading to CDN', color: 'sage' });
  const i4 = multi.add({ type: 'arc', text: 'Notifying services', color: 'amber' });
  multi.start();

  await sleep(fast ? 90 : slow ? 1100 : 360); multi.succeed(i0, 'Compiled — 0 errors');
  await sleep(fast ? 70 : slow ? 650 : 260); multi.succeed(i1, 'Bundle: 48.2 KB gzip');
  await sleep(fast ? 110 : slow ? 1000 : 340); multi.fail(i2, '3 test failures');
  await sleep(fast ? 70 : slow ? 550 : 240); multi.succeed(i3, 'CDN upload complete');
  await sleep(fast ? 55 : slow ? 450 : 180); multi.warn(i4, 'Staging notified; prod skipped');
  await sleep(fast ? 35 : slow ? 350 : 140);
  multi.stop();
  writeln();
}

// ─── Progress ─────────────────────────────────────────────────────────────

async function demoProgress() {
  sectionDivider('PROGRESS BARS', GRADIENTS.ocean);
  header('6 bar styles', 'ETA + rate + live reflow on window resize');

  const styles = [
    { style: 'block', color: 'chalk', label: 'block    ' },
    { style: 'shaded', color: 'azure', label: 'shaded   ' },
    { style: 'bracket', color: 'lavender', label: 'bracket  ' },
    { style: 'thin', color: 'sage', label: 'thin     ' },
    { style: 'brutalist', color: 'signal', label: 'brutalist' },
    { style: 'dots', color: 'amber', label: 'dots     ' },
  ];

  for (const def of styles) {
    const bar = new ProgressBar({
      total: 50, style: def.style, color: def.color,
      label: def.label, eta: true, rate: true
    });
    bar.start();
    for (let i = 0; i <= 50; i++) { bar.update(i); await sleep(fast ? 2 : slow ? 20 : 5); }
    bar.complete();
    await pause(18);
  }
  writeln();
}

async function demoMultiBar() {
  header('multi-bar', 'parallel downloads, builds, and more');

  const mb = new MultiBar();
  const b0 = mb.add({ total: 100, style: 'block', color: 'azure', label: 'kernel.img   ', eta: true });
  const b1 = mb.add({ total: 100, style: 'shaded', color: 'lavender', label: 'node_modules ', eta: true });
  const b2 = mb.add({ total: 100, style: 'thin', color: 'sage', label: 'assets.tar.gz', eta: true });
  const b3 = mb.add({ total: 100, style: 'dots', color: 'amber', label: 'cache.pack   ', eta: true });
  mb.start();

  for (let t = 0; t <= 100; t++) {
    mb.update(b0, t);
    mb.update(b1, Math.min(100, Math.round(t * 0.68)));
    mb.update(b2, Math.min(100, Math.round(t * 1.25)));
    mb.update(b3, Math.min(100, Math.round(t * 0.88)));
    mb.tick();
    await sleep(fast ? 2 : slow ? 22 : 6);
  }
  mb.stop();
  writeln();
}

// ─── Layout ───────────────────────────────────────────────────────────────

async function demoBoxes() {
  sectionDivider('LAYOUT', GRADIENTS.ice);
  header('boxes', '6 border styles · title · footer · padding · align');

  box(
    [
      gradient(`${c.b}lumi-cli${c.r}`, ...GRADIENTS.neon),
      '',
      `${c.fog}Terminal UI components with a consistent`,
      `color palette and zero runtime dependencies.${c.r}`,
      '',
      `${c.slate}v1.0.0 · MIT License · github.com/nijil71/Lumi${c.r}`,
    ],
    { border: 'thick', color: 'lavender', title: 'ABOUT', padding: 2, width: 58 }
  );
  writeln();

  box(
    `Service: api-gateway\nError:   ECONNREFUSED redis://10.0.1.15:6379\nRetry:   in 3000ms (attempt 2/5)`,
    {
      border: 'double', color: 'signal', title: '⚠ ALERT', padding: 1, width: 58,
      footer: '2026-04-14 · 09:41:22 UTC'
    }
  );
  writeln();

  box(
    [`${c.sage}${c.b}✔ Deployment successful${c.r}`, '', `${c.fog}Build a3f9c12 is live on all 34 edge nodes.${c.r}`],
    { border: 'rounded', color: 'sage', padding: 2, width: 52, align: 'center' }
  );
  writeln();
}

async function demoColumns() {
  header('columns', 'multi-column layouts');

  columns([
    { content: [`${c.lavender}${c.b}spinners${c.r}`, `${c.fog}20 types${c.r}`, `${c.fog}single + multi${c.r}`, `${c.fog}promise helper${c.r}`] },
    { content: [`${c.azure}${c.b}progress${c.r}`, `${c.fog}6 styles${c.r}`, `${c.fog}single + multi${c.r}`, `${c.fog}ETA + rate${c.r}`] },
    { content: [`${c.sage}${c.b}layout${c.r}`, `${c.fog}box, columns${c.r}`, `${c.fog}table, banner${c.r}`, `${c.fog}divider, badge${c.r}`] },
    { content: [`${c.amber}${c.b}logger${c.r}`, `${c.fog}6 log levels${c.r}`, `${c.fog}kv + step${c.r}`, `${c.fog}prefix + ts${c.r}`] },
  ], { gap: 4 });
  writeln();
}

// ─── Table ────────────────────────────────────────────────────────────────

async function demoTable() {
  sectionDivider('TABLE', GRADIENTS.sunset);
  header('table', '4 border styles · per-column align · cell truncation');

  table([
    { package: 'lumi-cli', version: '1.0.0', size: '~30 KB', deps: 0, license: 'MIT' },
    { package: 'chalk', version: '5.3.0', size: '8.2 KB', deps: 0, license: 'MIT' },
    { package: 'ora', version: '8.1.0', size: '11 KB', deps: 5, license: 'MIT' },
    { package: 'cli-progress', version: '3.12.0', size: '18 KB', deps: 1, license: 'MIT' },
    { package: 'boxen', version: '7.1.1', size: '22 KB', deps: 9, license: 'MIT' },
    { package: 'figlet', version: '1.7.0', size: '2.8 MB', deps: 0, license: 'MIT' },
  ], { border: 'single', align: { deps: 'right', size: 'right' } });
  writeln();
}

// ─── Badges & Gradient ────────────────────────────────────────────────────

async function demoBadges() {
  sectionDivider('BADGES · GRADIENT', GRADIENTS.gold);
  header('badges', 'inline status indicators');

  writeln('  ' + [
    badge('v1.0.0'), badge('PASS', { type: 'success' }), badge('FAIL', { type: 'error' }),
    badge('WARN', { type: 'warning' }), badge('INFO', { type: 'info' }),
    badge('PENDING'), badge('SKIPPED'),
  ].join('  '));
  writeln();

  header('gradient()', '8 presets · truecolor interpolation');
  const pairs = [
    ['neon', GRADIENTS.neon, 'Purple → Teal      '],
    ['fire', GRADIENTS.fire, 'Red → Amber        '],
    ['ice', GRADIENTS.ice, 'Blue → Sky         '],
    ['sunset', GRADIENTS.sunset, 'Red → Lavender     '],
    ['matrix', GRADIENTS.matrix, 'Bright → Deep Green'],
    ['gold', GRADIENTS.gold, 'Gold → Orange      '],
    ['dawn', GRADIENTS.dawn, 'Pink → Amber       '],
    ['ocean', GRADIENTS.ocean, 'Sky → Deep Blue    '],
  ];
  for (const [name, g, label] of pairs) {
    writeln(`  ${gradient('█'.repeat(32), ...g)}  ${c.slate}${name.padEnd(8)} ${label}${c.r}`);
    await pause(28);
  }
  writeln();
}

// ─── Sparklines ───────────────────────────────────────────────────────────

async function demoSparklines() {
  sectionDivider('SPARKLINES', GRADIENTS.matrix);
  header('sparkline()', 'inline block-character mini-charts for log lines and dashboards');

  const cpu = Array.from({ length: 24 }, () => Math.round(Math.random() * 80 + 5));
  const mem = Array.from({ length: 24 }, (_, i) => 60 + Math.round(Math.sin(i / 4) * 20));
  const rps = Array.from({ length: 24 }, () => Math.round(Math.random() * 400 + 100));
  const errs = [0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 5, 8, 3, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];

  log
    .kv('CPU   (24h)', sparkline(cpu, { color: 'azure' }) + `  ${c.slate}peak: ${Math.max(...cpu)}%${c.r}`)
    .kv('Memory (24h)', sparkline(mem, { color: 'sage' }) + `  ${c.slate}avg: ${Math.round(mem.reduce((a, b) => a + b) / mem.length)}%${c.r}`)
    .kv('RPS    (24h)', sparkline(rps, { color: 'amber' }) + `  ${c.slate}max: ${Math.max(...rps)}/s${c.r}`)
    .kv('Errors (24h)', sparkline(errs, { color: 'signal' }) + `  ${c.slate}total: ${errs.reduce((a, b) => a + b)}${c.r}`);
  writeln();
}

// ─── Tree ─────────────────────────────────────────────────────────────────

async function demoTree() {
  sectionDivider('TREE', GRADIENTS.ice);
  header('tree()', 'render nested objects — file trees, configs, dependencies');

  tree({
    'src/': {
      'index.js': null,
      'ansi.js': null,
      'spinners/': { 'index.js': null },
      'progress/': { 'index.js': null },
      'banner/': { 'index.js': null },
      'box/': { 'index.js': null },
      'table/': { 'index.js': null },
      'logger/': { 'index.js': null },
      'sparkline/': { 'index.js': null },
      'tree/': { 'index.js': null },
      'diff/': { 'index.js': null },
      'statusbar/': { 'index.js': null },
      'prompt/': { 'index.js': null },
      'types.d.ts': null,
    },
    'demo.js': null,
    'package.json': null,
    'README.md': null,
  });
  writeln();
}

// ─── Diff ─────────────────────────────────────────────────────────────────

async function demoDiff() {
  sectionDivider('DIFF', GRADIENTS.fire);
  header('diff()', 'colored line-by-line diff with context');

  const oldCode = `import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.listen(PORT, () => {
  console.log(\`Server on port \${PORT}\`);
});`;

  const newCode = `import express from 'express';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(\`Server on port \${PORT}\`);
});`;

  diff(oldCode, newCode, { oldLabel: 'server.js (before)', newLabel: 'server.js (after)' });
  writeln();
}

// ─── Status bar ───────────────────────────────────────────────────────────

async function demoStatusBar() {
  sectionDivider('STATUS BAR', GRADIENTS.dawn);
  header('StatusBar', 'persistent status line pinned to bottom row — never interrupts output');

  const bar = new StatusBar({ left: '', right: '' });

  const steps = [
    'Fetching dependencies…',
    'Resolving package tree…',
    'Verifying checksums…',
    'Extracting packages…',
    'Linking binaries…',
  ];

  for (let i = 0; i < steps.length; i++) {
    const pct = Math.round(((i + 1) / steps.length) * 100);
    bar.update({
      left: `  ${c.lavender}⣿${c.r} ${c.chalk}${steps[i]}${c.r}`,
      right: `${c.slate}${pct}% · ${i + 1}/${steps.length}${c.r}  `,
    });
    log.step(i + 1, steps.length, steps[i]);
    await sleep(fast ? 80 : slow ? 700 : 300);
  }

  bar.update({ left: `  ${c.sage}✔ Done${c.r}`, right: `${c.slate}100% · 5/5${c.r}  ` });
  await sleep(fast ? 60 : 400);
  bar.clear();
  writeln();
}

// ─── Prompts (interactive — only when explicitly requested) ───────────────

async function demoPrompts() {
  sectionDivider('PROMPTS', GRADIENTS.sunset);
  header('confirm · select · input', 'zero-dep interactive prompts — arrow keys, backspace, Ctrl+C safe');

  writeln(`${c.slate}  Running live prompts — press keys to interact.${c.r}`);
  writeln();

  const ok = await confirm('Ship this release to production?');
  const env = await select('Target environment:', ['dev', 'staging', 'production'], { default: 'staging' });
  const tag = await input('Release tag:', { default: 'v1.0.0', placeholder: 'e.g. v2.0.0' });

  writeln();
  log
    .kv('confirmed', ok ? 'yes' : 'no')
    .kv('env', env)
    .kv('tag', tag);
  writeln();
}

// ─── Links ────────────────────────────────────────────────────────────────

async function demoLinks() {
  sectionDivider('HYPERLINKS', GRADIENTS.ocean);
  header('ansi.link()', 'OSC 8 clickable links — supported in iTerm2, WezTerm, Windows Terminal, Kitty');

  writeln(`  Docs:    ${ansi.link(`${c.azure}lumi-cli on GitHub${c.r}`, 'https://github.com/nijil71/Lumi')}`);
  writeln(`  npm:     ${ansi.link(`${c.amber}npmjs.com/package/lumi-cli${c.r}`, 'https://www.npmjs.com/package/lumi-cli')}`);
  writeln(`  Issues:  ${ansi.link(`${c.signal}Report a bug${c.r}`, 'https://github.com/nijil71/Lumi/issues')}`);
  writeln();
}

// ─── Advanced Prompts ───────────────────────────────────────────────────────

async function demoPromptAdvanced() {
  sectionDivider('ADVANCED PROMPTS');
  write(ansi.show());

  const choices = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Zig'];
  const favs = await multiSelect('Which languages do you like?', choices, { default: ['Rust', 'TypeScript'] });

  writeln();

  const cloud = ['AWS', 'GCP', 'Azure', 'Vercel', 'Netlify', 'Render', 'Heroku', 'Fly.io'];
  const deploy = await autocomplete('Where do you want to deploy? (Type to search)', cloud);

  write(ansi.hide());
}

// ─── TaskRunner ─────────────────────────────────────────────────────────────

async function demoTasks() {
  sectionDivider('TASK RUNNER');

  const runner = new TaskRunner([
    {
      title: 'Validating configuration',
      task: async (ctx, task) => {
        await sleep(600);
        ctx.valid = true;
      }
    },
    {
      title: 'Fetching container image',
      task: async (ctx, task) => {
        task.text = 'Pulling layers...';
        await sleep(500);
        task.text = 'Extracting binaries...';
        await sleep(500);
      }
    },
    {
      title: 'Pre-flight checks',
      task: async (ctx, task) => {
        throw new Error('Port 8080 is already in use.');
      }
    }
  ], { exitOnError: false });

  await runner.run();
}

// ─── Pager ──────────────────────────────────────────────────────────────────

async function demoLayout() {
  sectionDivider('LAYOUT');

  writeln(`${c.slate}Building a live dashboard from this wireframe:${c.r}`);
  writeln();
  const wireframe = [
    '  ╭──────────────────────────────────────────╮',
    '  │                  header                  │',
    '  ├────────────────┬─────────────────────────┤',
    '  │    metrics     │         events          │',
    '  │                │                         │',
    '  ├────────────────┴─────────────────────────┤',
    '  │                  footer                  │',
    '  ╰──────────────────────────────────────────╯',
  ];
  for (const line of wireframe) writeln(`${c.graphite}${line}${c.r}`);
  writeln();
  writeln(`${c.slate}Layout.sketch reads the drawing — border style, cell spans, track sizes — and renders.${c.r}`);
  writeln(`${c.slate}Opening in 1.2s · runs for ~6s · Ctrl+C to exit early${c.r}`);
  await sleep(1200);

  const lo = Layout.sketch`
    ╭──────────────────────────────────────────────────────╮
    │                        header                        │
    ├────────────────────┬─────────────────────────────────┤
    │                    │                                 │
    │      metrics       │             events              │
    │                    │                                 │
    │                    │                                 │
    │                    │                                 │
    ├────────────────────┴─────────────────────────────────┤
    │                        footer                        │
    ╰──────────────────────────────────────────────────────╯
  `;
  lo.start();

  const cpu = Array.from({ length: 24 }, () => Math.random() * 100);
  const mem = Array.from({ length: 24 }, () => 40 + Math.random() * 40);
  const req = Array.from({ length: 24 }, () => Math.random() * 200);
  const events = [];
  const sources = ['api', 'db ', 'svc', 'web', 'job'];
  const verbs   = ['started', 'ok     ', 'retried', 'queued ', 'closed ', 'slow   '];

  lo.set('header', () =>
    gradient('  LUMI.sketch → live grid · only changed lines repaint', ...GRADIENTS.neon)
  );
  lo.set('footer', `${c.d}  tip: each frame diffs against the last — zero flicker${c.r}`);

  const tick = setInterval(() => {
    cpu.shift(); cpu.push(Math.random() * 100);
    mem.shift(); mem.push(40 + Math.random() * 40);
    req.shift(); req.push(Math.random() * 200);

    const s = sources[Math.floor(Math.random() * sources.length)];
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const ms = (Math.random() * 80).toFixed(0).padStart(3, ' ');
    events.push(
      `${c.slate}${new Date().toTimeString().slice(0, 8)}${c.r}  ` +
      `${c.azure}${s}${c.r}  ${v} ${c.d}${ms}ms${c.r}`
    );
    if (events.length > 200) events.shift();

    lo.set('metrics', () => [
      '',
      `  ${c.chalk}CPU    ${c.r}${sparkline(cpu, { color: 'azure' })}  ${cpu.at(-1).toFixed(0)}%`,
      `  ${c.chalk}MEM    ${c.r}${sparkline(mem, { color: 'sage'  })}  ${mem.at(-1).toFixed(0)}%`,
      `  ${c.chalk}REQ/s  ${c.r}${sparkline(req, { color: 'amber' })}  ${req.at(-1).toFixed(0)}`,
      '',
      `  ${c.d}updated ${new Date().toLocaleTimeString()}${c.r}`,
    ]);
    lo.set('events', () => events.slice(-200));
    lo.render();
  }, 180);

  await sleep(6000);
  clearInterval(tick);
  lo.stop();
}

async function demoPager() {
  sectionDivider('PAGER');

  const lines = Array.from({ length: 300 }, (_, i) => `${c.dim}${i + 1}${c.r}  [SYS] System log entry - heartbeat check ok - load avg: ${(Math.random() * 2).toFixed(2)}`);

  writeln(`${c.slate}Launching pager in 1s...${c.r}`);
  await sleep(1000);

  await pager(lines, { title: 'v1.0.7 System Logs' });
}

// ─── Closer ───────────────────────────────────────────────────────────────

async function closer() {
  const w = cols();
  const dividerW = Math.min(w, 88);
  const dividerIndent = ' '.repeat(Math.max(0, Math.floor((w - dividerW) / 2)));
  writeln(dividerIndent + gradient('━'.repeat(dividerW), ...GRADIENTS.fire));
  writeln();

  banner('DONE', { gradient: GRADIENTS.neon, align: 'center', gap: 2 });

  const boxW = 46;
  const boxIndent = ' '.repeat(Math.max(0, Math.floor((w - boxW) / 2)));
  box(
    [
      `  ${c.sage}$${c.r}  ${c.chalk}npm install @nijil71/lumi-cli${c.r}`,
      `  ${c.sage}$${c.r}  ${c.chalk}npx lumi demo${c.r}`,
    ],
    { border: 'thick', color: 'lavender', title: 'GET STARTED', padding: 1, width: boxW, indent: boxIndent }
  );
  writeln();

  const url = 'github.com/nijil71/Lumi';
  const center = Math.max(0, Math.floor((w - url.length) / 2));
  writeln(' '.repeat(center) + `${c.graphite}${url}${c.r}`);
  writeln();
  write(ansi.show());
}

// ─── Section registry ─────────────────────────────────────────────────────

const SECTIONS = {
  banner: splash,
  logger: demoLogger,
  spinners: demoSpinners,
  pets: demoPetSpinners,
  multi: demoMultiSpinner,
  progress: demoProgress,
  multibar: demoMultiBar,
  boxes: demoBoxes,
  columns: demoColumns,
  table: demoTable,
  badges: demoBadges,
  sparklines: demoSparklines,
  tree: demoTree,
  diff: demoDiff,
  statusbar: demoStatusBar,
  links: demoLinks,
  prompts: demoPrompts,   // interactive — run with: node demo.js prompts
  advancedprompts: demoPromptAdvanced, // interactive
  tasks: demoTasks,
  layout: demoLayout,     // takes over the screen (alt buffer)
  pager: demoPager,       // interactive
  closer: closer,
};

// ─── Main ─────────────────────────────────────────────────────────────────

async function demo() {
  const flags = ['--slow', '--fast'];
  const args = process.argv.slice(2).filter(a => !flags.includes(a));
  const requested = args.filter(a => SECTIONS[a]);

  process.stdout.write('\x1bc');
  write(ansi.hide());

  if (requested.length > 0) {
    // When running explicit sections, show() the cursor first if prompts section included
    for (const name of requested) await SECTIONS[name]();
  } else {
    // Auto-run excludes interactive / alt-screen sections
    const excludes = ['prompts', 'advancedprompts', 'pager', 'layout'];
    const autoSections = Object.entries(SECTIONS).filter(([k]) => !excludes.includes(k));
    for (const [, fn] of autoSections) await fn();
  }

  write(ansi.show());
}

demo().catch(e => {
  write(ansi.show());
  console.error(e);
  process.exit(1);
});
