# lumina-cli

**A strikingly beautiful terminal UI toolkit for Node.js.**  
Swiss precision · Bauhaus-meets-brutalism · Zero dependencies

```
npm install lumina-cli
```

For local development in this folder:

```bash
npm test
npm run demo
```

---

## philosophy

Most terminal libraries try to replicate web UIs in a character grid. Lumina doesn't.

It takes inspiration from Swiss grid systems and IBM technical documentation — monochromatic precision, purposeful use of color, typographic hierarchy that works at 80 columns or 240. No gradients, no glow, no themes. Just ink, paper, and the occasional signal color that means something.

---

## what's inside

```
lumina-cli
├── spinners     12 handcrafted loading animations
├── progress     6 progress bar styles + multi-bar
├── banner       handcrafted 5-row ASCII font, dividers, headers, badges
├── box          5 border styles for structured content
├── table        data table renderer
└── logger       structured log output with prefixes, kv pairs, step sequences
```

---

## quick start

```js
import { spinner, banner, log, box, table, progressBar } from 'lumina-cli';

// banner
banner('LUMINA', { color: 'chalk', align: 'center' });

// logger
log.info('Initializing...');
log.success('Connected to database');
log.warn('Memory at 78%');
log.error('Connection refused');

// spinner
const sp = spinner({ type: 'braille', text: 'Compiling...', color: 'azure' });
sp.start();
await doWork();
sp.succeed('Compiled in 1.2s');

// progress
const bar = progressBar({ total: 100, style: 'bracket', color: 'lavender', label: 'uploading' });
bar.start();
bar.update(50);
bar.complete('Upload done');

// box
box('Hello from lumina.', { border: 'thick', color: 'chalk', title: 'NOTE' });

// table
table([
  { name: 'alpha', version: '1.0.0', status: 'stable' },
  { name: 'beta',  version: '2.1.3', status: 'rc' },
]);
```

---

## spinners

12 unique, handcrafted animation sequences. Each has its own rhythm and personality.

| name | character | feel |
|------|-----------|------|
| `braille` | ⠋⠙⠹⠸⠼⠴⠦ | classic, refined |
| `block` | ▏▎▍▌▋▊▉█ | brutalist, architectural |
| `dash` | ▰▱▱▱▱▱▱ | horizontal rhythm |
| `orbital` | ◜◝◞◟ | circular, clean |
| `pulse` | ·•●◉● | slow breath, alive |
| `grid` | ⣾⣽⣻⢿⡿⣟ | IBM heritage |
| `triangle` | ◢◣◤◥ | sharp, angular |
| `snake` | ⠁⠂⠄⡀⢀⠠ | hypnotic river |
| `signal` | · ·· ··· | morse, radio tower |
| `cross` | ┼╋┿╈╉╊ | swiss grid |
| `morph` | ◰◳◲◱ | shape-shifts |
| `clock` | 🕛🕐🕑🕒 | precise |

```js
import { Spinner, MultiSpinner } from 'lumina-cli';

// single spinner
const sp = new Spinner({ type: 'dash', text: 'Loading', color: 'azure' });
sp.start();
sp.succeed('Done');     // ✔
sp.fail('Failed');      // ✘
sp.warn('Partial');     // ⚠
sp.info('Note');        // ℹ

// multiple spinners simultaneously
const multi = new MultiSpinner();
const a = multi.add({ type: 'braille', text: 'Compiling',  color: 'azure'    });
const b = multi.add({ type: 'dash',    text: 'Bundling',   color: 'lavender' });
const c = multi.add({ type: 'pulse',   text: 'Uploading',  color: 'sage'     });
multi.start();
// ... resolve them at different times
multi.succeed(a, 'Compiled — 0 errors');
multi.fail(b, '3 bundle warnings');
multi.succeed(c, 'Upload complete');
multi.stop();
```

**Available colors:** `chalk` · `signal` · `sage` · `azure` · `amber` · `lavender` · `dim`

---

## progress bars

6 distinct styles. Each maps to a different visual vocabulary.

| style | character | personality |
|-------|-----------|-------------|
| `block` | █░ | solid, classic |
| `shaded` | ▓░ | softer graduation |
| `bracket` | [──▶ ] | swiss precision |
| `thin` | ▬▶╌ | minimal, elegant |
| `brutalist` | ▐■□▌ | raw, architectural |
| `dots` | ●○ | playful grid |

```js
import { ProgressBar, MultiBar } from 'lumina-cli';

const bar = new ProgressBar({
  total:  100,
  style:  'bracket',     // block | shaded | bracket | thin | brutalist | dots
  color:  'azure',       // chalk | signal | sage | azure | amber | lavender
  label:  'kernel.img',
  width:  80,            // defaults to terminal width
});

bar.start();
bar.update(50, 'halfway there');
bar.increment(10);
bar.complete('Done!');

// multiple bars
const mb = new MultiBar();
const b0 = mb.add({ total: 100, style: 'block',  color: 'azure',    label: 'file-a' });
const b1 = mb.add({ total: 200, style: 'shaded', color: 'lavender', label: 'file-b' });
mb.start();
mb.update(b0, 60);
mb.update(b1, 140);
mb.tick();   // re-render
mb.stop();
```

---

## banner

Handcrafted 5-row block letterforms (original design, not figlet). Supports A–Z, 0–9, and common punctuation.

```js
import { banner, divider, header, badge } from 'lumina-cli';

banner('DONE', { color: 'sage', align: 'center' });
// align: 'left' | 'center' | 'right'
// color: 'chalk' | 'signal' | 'sage' | 'azure' | 'amber' | 'lavender' | 'dim'
// char:  '█' (default) — any character works: '#', '▓', '*', ...

divider({ label: 'SECTION', char: '─' });
// ─────────────────── SECTION ───────────────────

header('logging', 'structured output at a glance');
// bold title + subtitle + thin rule

const b = badge('v1.0.0', { type: 'success' });
// type: 'default' | 'success' | 'error' | 'warning' | 'info'
console.log(`Release ${b} is live`);
```

---

## box

```js
import { box } from 'lumina-cli';

box('Simple content.', {
  border:  'single',   // single | double | rounded | thick | dashed | ascii
  color:   'chalk',    // chalk | signal | sage | azure | amber | lavender | dim
  title:   'TITLE',    // optional title in top border
  footer:  'metadata', // optional footer row
  padding: 1,          // inner horizontal padding
  width:   60,         // defaults to terminal width
});

// multi-line content
box([
  `${c.b}Bold heading${c.r}`,
  '',
  `${c.fog}Body text here.${c.r}`,
], { border: 'thick', color: 'signal', title: 'ALERT' });
```

---

## table

```js
import { table } from 'lumina-cli';

table([
  { package: 'lumina-cli', version: '1.0.0', deps: 0 },
  { package: 'chalk',      version: '5.3.0', deps: 0 },
], {
  border:  'single',   // single | thick | double | minimal
  color:   'default',  // default | signal | azure
  headers: ['package', 'version', 'deps'],  // optional — inferred from data keys
});
```

---

## logger

```js
import { log, createLogger } from 'lumina-cli';

// global logger
log.info('Server starting');
log.success('Listening on :3000');
log.warn('High memory usage');
log.error('Unhandled rejection');
log.debug('Event loop lag: 2ms');

// named logger with timestamps
const syslog = createLogger({ prefix: 'api', timestamps: true });
syslog.info('Request received');

// key-value pairs (great for env dumps)
log.kv('NODE_ENV',  'production');
log.kv('PORT',      '3000');
log.kv('DB_HOST',   'postgres://localhost/mydb');

// step sequences
log.step(1, 8, 'Checkout repository');
log.step(2, 8, 'Install dependencies');

// blank line
log.br();
```

---

## color palette

The Lumina palette is Bauhaus-inspired: neutrals are the foundation, signal colors are used with restraint.

```
neutrals  ink → carbon → graphite → slate → mist → fog → chalk → white
signals   signal (red) · amber (warning) · sage (success) · azure (info) · lavender (accent)
```

Access palette colors directly for custom output:

```js
import { c, writeln } from 'lumina-cli';

writeln(`${c.signal}${c.b}CRITICAL${c.r} ${c.fog}something went wrong${c.r}`);
writeln(`${c.sage}✔${c.r} ${c.chalk}all systems nominal${c.r}`);
writeln(`${c.slate}${c.dim}verbose: 0 errors, 0 warnings${c.r}`);
```

---

## run the demo

```bash
npm run demo
```

Runs a ~50s showcase of every component: banners, all 12 spinners, multi-spinner, all 6 progress styles, multi-bar, boxes, tables, key-value logs, and a CI/CD pipeline simulation.

---

## cli

```bash
lumina --help
lumina demo
lumina --version
```

---

## license

MIT
