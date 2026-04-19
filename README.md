```
 ██╗     ██╗   ██╗███╗   ███╗██╗
 ██║     ██║   ██║████╗ ████║██║
 ██║     ██║   ██║██╔████╔██║██║
 ██║     ██║   ██║██║╚██╔╝██║██║
 ███████╗╚██████╔╝██║ ╚═╝ ██║██║
 ╚══════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝
```

Terminal UI toolkit for Node.js — spinners, progress bars, tables, boxes, banners, gradients, prompts, and more. Zero runtime dependencies.

[![npm](https://img.shields.io/npm/v/@nijil71/lumi-cli?color=%236C47FF&style=flat-square&label=npm)](https://www.npmjs.com/package/@nijil71/lumi-cli)
[![install size](https://img.shields.io/badge/install%20size-~30%20KB-brightgreen?style=flat-square)](https://packagephobia.com/result?p=lumi-cli)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](https://www.npmjs.com/package/lumi-cli?activeTab=dependencies)
[![node](https://img.shields.io/badge/node-%E2%89%A518-important?style=flat-square)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

---

## See it in action

```bash
npx @nijil71/lumi-cli demo
```

Runs without installing. Shows every component live in your terminal.

---

## Install

```bash
npm install @nijil71/lumi-cli
```

> **Node.js ≥ 18** · ESM + CommonJS · No polyfills · No setup

```js
// ESM
import { Spinner, ProgressBar, box, table, banner, log } from '@nijil71/lumi-cli';

// CommonJS
const { Spinner, ProgressBar, box, table, banner, log } = require('@nijil71/lumi-cli');
```

---

## Quick start

A 60-second tour — a fake "deploy" script showing six components compose cleanly in one flow. [See the source →](examples/quickstart.js)

```js
import { banner, box, table, Spinner, ProgressBar, log, c, gradient, GRADIENTS } from '@nijil71/lumi-cli';

banner('DEPLOY', { gradient: GRADIENTS.neon, align: 'center' });

log.step(1, 3, 'Running tests');
await Spinner.promise(runTests(), { text: 'running 42 tests', successText: '42 passed', elapsed: true });

log.step(2, 3, 'Building bundle');
const bar = new ProgressBar({ total: 100, style: 'block', label: 'bundle.tar.gz', eta: true });
bar.start();
for (let i = 0; i <= 100; i++) { bar.update(i); await wait(15); }
bar.complete('built');

log.step(3, 3, 'Uploading');
await Spinner.promise(upload(), { text: 'uploading', successText: 'live', elapsed: true });

box([`${c.sage}✓${c.r}  deployed to ${c.azure}production${c.r}`],
    { border: 'rounded', color: 'lavender', title: 'COMPLETE', padding: 1 });
```

Clone and run it live:
```bash
git clone https://github.com/nijil71/Lumi && cd Lumi
node examples/quickstart.js
```

---

## What's inside

```
lumi-cli
├── Spinners      25 types  ·  single + multi  ·  promise wrapper  ·  11 pet spinners
├── Progress      6 styles  ·  single + multi  ·  ETA + rate
├── Box           6 borders ·  title + footer  ·  align + padding
├── Table         4 borders ·  per-col align   ·  truncation
├── Banner        2 styles  ·  figlet + block  ·  gradients
├── Logger        5 levels  ·  tags + badges   ·  timestamps
├── Tree          file tree ·  connectors      ·  colors
├── Diff          inline    ·  added + removed ·  word-diff
├── Sparkline     bar chart ·  min/max + NaN   ·  colors
├── StatusBar     sticky    ·  left + right    ·  updates
├── Layout        sketch-mode · grid cells · diffed renders · shared borders
├── Tasks         runner    ·  orchestrator    ·  graceful fails
├── Pager         raw mode  ·  terminal paginator · zero deps
└── Prompts       input, select, multiSelect, autocomplete, confirm
└── Utils         ANSI primitives · OSC 8 links · TTY detection
```

---

## Spinners

```js
import { Spinner } from '@nijil71/lumi-cli';

const sp = new Spinner({ type: 'wave', text: 'Building…', color: 'azure', elapsed: true });
sp.start();
// ... do work ...
sp.succeed('Build complete — 1.2s');
// or: sp.fail(msg)  sp.warn(msg)  sp.info(msg)
```

**Wrap a promise** — start, await, print result automatically:

```js
await Spinner.promise(fetchData(), {
  text:        'Fetching data…',
  successText: 'Data loaded',
  failText:    'Fetch failed',
  color:       'sage',
});
```

**Run tasks in parallel:**

```js
import { MultiSpinner } from '@nijil71/lumi-cli';

const multi = new MultiSpinner();
const a = multi.add({ type: 'braille', text: 'Compiling',  color: 'azure'    });
const b = multi.add({ type: 'wave',    text: 'Bundling',   color: 'lavender' });
const c = multi.add({ type: 'cyber',   text: 'Testing',    color: 'chalk'    });
multi.start();

// resolve each independently, in any order
await compile(); multi.succeed(a, 'Compiled — 0 errors');
await bundle();  multi.succeed(b, 'Bundle: 48 KB gzip');
await test();    multi.fail(c,    '3 failures');
multi.stop();
```

**25 spinner types** — including 11 pet spinners:

| name | preview | interval |
|------|---------|----------|
| `braille`  | ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏     | 80ms  |
| `line`     | \|/─\\             | 80ms  |
| `arc`      | ◐◓◑◒               | 100ms |
| `grid`     | ⣾⣽⣻⢿⡿⣟⣯⣷         | 130ms |
| `wave`     | ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁  | 80ms  |
| `cyber`    | ⣿⣾⣼⣸⢸⡸⡰⡠⡀ …     | 70ms  |
| `snake`    | ⠁⠂⠄⡀⢀⠠⠐⠈ …       | 70ms  |
| `bounce`   | ⠁⠂⠄⠂               | 90ms  |
| `fade`     | █▓▒░               | 110ms |
| `slash`    | ╱╲                 | 80ms  |
| `grow`     | ▏▍▋█               | 90ms  |
| `ripple`   | ·∘○◯               | 100ms |
| `runner`   | ᗧ···               | 120ms |
| `heartbeat`| ♡♥♡                | 100ms |

### Pet spinners 🐾

Action kaomojis (single-line) and large ASCII art animals (multi-line) that animate as your loading indicators. `lumi-cli` automatically handles multi-line rendering and cursor management.

```js
const sp = new Spinner({ type: 'catChase', text: 'Processing…', color: 'lavender' });
sp.start();
// ...
sp.succeed('Done');
```

| name | style | description | interval |
|------|-------|-------------|----------|
| `catChase`    | single | `(=^･ω･^=)` chasing a mouse (`🐁`) | 100ms |
| `dogFetch`    | single | `( ᐡ • ﻌ • ᐡ )` fetching a ball | 150ms |
| `bunnyEat`    | single | `₍ᐢ•ﻌ•ᐢ₎` chewing on a carrot | 180ms |
| `fishSwim`    | single | `ϵ( 'Θ' )϶` swimming through bubbles | 150ms |
| `bearHoney`   | single | `ʕ •ᴥ• ʔ` bouncing to eat honey | 200ms |
| `caterpillar` | single | `🐛` smoothly crawling across | 80ms |
| `catWalk`     | multi  | 🐱 Stretching cat animation      | 200ms |
| `dogWag`      | multi  | 🐶 Dog wagging its tail         | 180ms |
| `bunnyHop`    | multi  | 🐰 Bunny hopping in place       | 200ms |
| `birdFlap`    | multi  | 🐦 Bird flapping its wings      | 150ms |
| `turtleCrawl` | multi  | 🐢 Turtle crawling along        | 250ms |

Pet spinners automatically clean up on `succeed()`, `fail()`, `warn()`, `info()`, and `stop()`.

---

## Progress bars

```js
import { ProgressBar } from '@nijil71/lumi-cli';

const bar = new ProgressBar({
  total: 100,
  style: 'wave',      // block | shaded | bracket | thin | brutalist | dots
  color: 'azure',     // chalk | signal | sage | azure | amber | lavender
  label: 'uploading',
  eta:   true,        // estimated time remaining
  rate:  true,        // items/sec
});

bar.start();
bar.update(50);       // jump to value
bar.increment(10);    // add to current
bar.complete('Done'); // jump to 100% + print checkmark
```

**Multiple bars:**

```js
import { MultiBar } from '@nijil71/lumi-cli';

const mb = new MultiBar();
const a = mb.add({ total: 100, style: 'block',  label: 'kernel.img',    color: 'azure'    });
const b = mb.add({ total: 100, style: 'shaded', label: 'node_modules',  color: 'lavender' });
const c = mb.add({ total: 100, style: 'dots',   label: 'assets.tar.gz', color: 'sage'     });
mb.start();

// call mb.update(idx, value) + mb.tick() each frame
mb.update(a, 60); mb.update(b, 40); mb.update(c, 90);
mb.tick();
mb.stop();
```

---

## Boxes

```js
import { box, columns } from '@nijil71/lumi-cli';

box('Hello from lumi.', {
  border:  'rounded',   // single | double | rounded | thick | dashed | ascii
  color:   'azure',
  title:   'NOTE',
  footer:  'v1.0.0',
  padding: 1,
  width:   60,
  align:   'center',    // left | center | right
});
```

```
╭──────────────── NOTE ───────────────────╮
│                                         │
│           Hello from lumi.              │
│                                         │
├─────────────────────────────────────────┤
│  v1.0.0                                 │
╰─────────────────────────────────────────╯
```

**Multi-column layout:**

```js
columns([
  { content: ['col one', 'line 2'] },
  { content: ['col two', 'line 2'] },
  { content: ['col three'] },
], { gap: 4 });
```

---

## Table

```js
import { table } from '@nijil71/lumi-cli';

table([
  { name: 'alpha', version: '1.0.0', status: 'stable', size: '12 KB' },
  { name: 'beta',  version: '2.1.3', status: 'rc',     size: '8 KB'  },
], {
  border:   'single',               // single | thick | double | minimal
  align:    { size: 'right' },      // per-column alignment
  maxWidth: { name: 20 },           // truncate long values
});
```

---

## Banner

Block-letter ASCII art — custom 5×5 glyph set, A–Z, 0–9, punctuation.

```js
import { banner, divider, header, badge } from '@nijil71/lumi-cli';

// Flat color
banner('LUMI', { color: 'lavender', align: 'center' });

// Truecolor gradient
import { GRADIENTS } from '@nijil71/lumi-cli';
banner('LUMI', { gradient: GRADIENTS.neon, align: 'center' });

divider({ label: 'SECTION' });

header('deployment', 'step 3 of 8');

console.log(`Build ${badge('v1.0.0', { type: 'success' })} deployed`);
// badge types: default | success | error | warning | info
```

---

## Gradient

```js
import { gradient, GRADIENTS, writeln } from '@nijil71/lumi-cli';

// gradient(text, fromRGB, toRGB)
writeln(gradient('Hello, terminal.', [108, 71, 255], [0, 201, 167]));

// 8 built-in presets — spread directly into gradient()
writeln(gradient('neon',   ...GRADIENTS.neon));
writeln(gradient('fire',   ...GRADIENTS.fire));
writeln(gradient('ice',    ...GRADIENTS.ice));
writeln(gradient('sunset', ...GRADIENTS.sunset));
writeln(gradient('matrix', ...GRADIENTS.matrix));
writeln(gradient('gold',   ...GRADIENTS.gold));
writeln(gradient('dawn',   ...GRADIENTS.dawn));
writeln(gradient('ocean',  ...GRADIENTS.ocean));
```

Gracefully falls back to unstyled text when the terminal doesn't support truecolor.

---

## Logger

```js
import { log, createLogger } from '@nijil71/lumi-cli';

log.info('Server starting');
log.success('Listening on :3000');
log.warn('Memory at 78%');
log.error('Unhandled rejection');
log.debug('Event loop lag: 2ms');

// key-value pairs — aligned
log.kv('NODE_ENV', 'production');
log.kv('PORT',     '3000');
log.kv('REGION',   'ap-south-1');

// step sequences
log.step(1, 8, 'Checkout repository');
log.step(2, 8, 'Install dependencies');

// named logger with timestamps
const api = createLogger({ prefix: 'api', timestamps: true });
api.info('Request received');
api.success('Response sent — 12ms');
```

---

## Colors & palette

7 semantic colors used consistently across all components:

| name | hex | use |
|------|-----|-----|
| `chalk`    | `#EBEBF0` | default text, high contrast |
| `signal`   | `#FF504C` | errors, critical |
| `sage`     | `#50C88C` | success, green states |
| `azure`    | `#3CA0FF` | info, links, active |
| `amber`    | `#FFB928` | warnings, caution |
| `lavender` | `#B48CFF` | accents, highlights |
| `dim`      | `#5A5A69` | muted, disabled |

**Use palette directly in your own output:**

```js
import { c, writeln } from '@nijil71/lumi-cli';

writeln(`${c.signal}${c.b}CRITICAL${c.r} ${c.fog}connection dropped${c.r}`);
writeln(`${c.sage}✔${c.r} all systems nominal`);
writeln(`${c.amber}⚠${c.r} approaching rate limit`);
```

---

## Terminal behavior

**Non-TTY / Headless Environments** — when stdout is piped or redirected (e.g. in GitHub Actions, Jenkins, or log aggregators), `lumi-cli` gracefully degrades:
- **Spinners**: Animations are suspended. `sp.succeed()` and similar methods will print a single flat log line reflecting the final state.
- **Progress bars**: Instead of rewriting the terminal line, bars emit a flat periodic log at `25%`, `50%`, `75%`, and `100%` milestones so you can track CI progress without spamming a million lines of progress frame text.
- **Colors**: Stripped automatically — emitting clean logs without `\x1b` ANSI noise.
- **Prompts**: `input`, `select`, and `confirm` immediately bypass interation and return their `default` value with a `[non-interactive]` notice.

**Custom Overrides:**
- **`NO_COLOR`** — set `NO_COLOR=1` to forcefully disable all color ([no-color.org](https://no-color.org/))
- **`FORCE_COLOR`** — override detection (`FORCE_COLOR=3` for truecolor, `FORCE_COLOR=0` to disable)
- **Ctrl+C safety** — all animated and interactive components restore the terminal cursor state on `SIGINT`.

---

## Benchmarks

Lumi is optimized for performance and minimal overhead, enabling its use in intensive CLI tasks without bottlenecking your logic:

- **Spinners**: ~3,000,000+ renders/sec
- **Diff Engine**: 10,000 line arrays with 5% mutations computed in ~65ms
- **Tables**: 10,000 rows (4 columns) aligned and rendered in ~120ms

*(Benchmarks run on Node 22 on average consumer hardware).*

---

## Sparklines

Compact inline charts using Unicode block characters. Perfect inside log lines.

```js
import { sparkline, log } from '@nijil71/lumi-cli';

const cpu  = [12, 45, 78, 34, 90, 23, 55, 67, 88, 41];
const errs = [0, 0, 1, 0, 0, 3, 8, 2, 0, 0];

log.kv('CPU   (10m)', sparkline(cpu,  { color: 'azure'  }));
log.kv('Errors(10m)', sparkline(errs, { color: 'signal' }));
// CPU   (10m)   ▁▄▇▃█▂▅▆█▃
// Errors(10m)   ▁▁▂▁▁▃█▂▁▁
```

Options: `color`, `min`, `max` (clamp/override scale).

---

## Tree

Render nested file trees, config hierarchies, or dependency graphs.

```js
import { tree } from '@nijil71/lumi-cli';

tree({
  'src/': {
    'index.js': null,
    'utils/': {
      'math.js':   null,
      'string.js': null,
    },
  },
  'package.json': null,
  'README.md':    null,
});
```

```
├── src/
│   ├── index.js
│   └── utils/
│       ├── math.js
│       └── string.js
├── package.json
└── README.md
```

Options: `color`, `dirColor`, `lineColor`.

---

## Diff

Colored line-by-line diff using LCS. Added lines in green, removed in red.

```js
import { diff } from '@nijil71/lumi-cli';

diff(oldCode, newCode, {
  oldLabel:    'server.js (before)',
  newLabel:    'server.js (after)',
  context:     3,      // context lines around changes (default: 3)
  lineNumbers: true,   // show line numbers (default: true)
});
```

```
─ server.js (before)
+ server.js (after)
────────────────────────────────────────
   1   const PORT = 3000;
─  2   res.send('Hello world');
+  2   res.json({ status: 'ok' });
   3   app.listen(PORT, ...
```

---

## StatusBar

A persistent status line pinned to the bottom terminal row. Uses cursor save/restore — never interrupts your normal log output.

```js
import { StatusBar } from '@nijil71/lumi-cli';

const bar = new StatusBar({ left: '⣿ Building…', right: 'CPU: 42%' });
bar.render();

// update during long-running work
bar.update({ left: '⣿ Bundling…', right: 'CPU: 78%  ETA: 12s' });

// remove when done
bar.clear();
```

---

## Layout

Grid-based region renderer. Split the terminal into named cells and update each independently. Two call shapes — both return the same `Layout`:

### Sketch mode — the layout IS the drawing

Draw the wireframe. The parser reads cell names, track sizes, spans, AND border style straight from your ASCII.

```js
import { Layout, sparkline, c } from '@nijil71/lumi-cli';

const lo = Layout.sketch`
  ╭────────────────────────────────────────────╮
  │                   header                   │
  ├─────────────────┬──────────────────────────┤
  │                 │                          │
  │     metrics     │           events         │
  │                 │                          │
  │                 │                          │
  ├─────────────────┴──────────────────────────┤
  │                   footer                   │
  ╰────────────────────────────────────────────╯
`;

lo.start();
lo.set('header', 'Live · press Ctrl+C to quit');
lo.set('metrics', () => [
  `CPU  ${sparkline(cpu)}  ${cpu.at(-1)}%`,
  `MEM  ${sparkline(mem)}  ${mem.at(-1)}%`,
]);
lo.set('events', () => events.slice(-50).join('\n'));
setInterval(() => lo.render(), 200);
```

**What the parser reads:**

| From your drawing | What you get |
|---|---|
| Corner chars `╭ ╔ ┏ ┌ +` | Border style (`rounded`, `double`, `thick`, `single`, `ascii`) |
| Drawn widths / heights | Flex track weights (proportional to what you drew) |
| Repeating a label across regions OR drawing no divider between them | Cell spans (`header` above spans both columns because no `│` interrupts its row) |
| Text inside a region, OR on the top border (`┌─ header ─┐`) | Cell name |

**Shared borders.** Sketch mode drives `gridBorder`, which draws one frame with proper T-junctions (`┬ ┴ ├ ┤ ┼`) where cells meet. You never get double-thick walls, and cells that span ignore the dividers underneath them:

```
╭────────────────────────────────────────────╮
│                   header                   │
├─────────────────┬──────────────────────────┤   ← T-junctions snap to header spanning across
│     metrics     │           events         │
├─────────────────┴──────────────────────────┤
│                   footer                   │
╰────────────────────────────────────────────╯
```

**Function form** takes options:
```js
Layout.sketch(sketchString, {
  titles:    { events: 'Live feed' },             // render titles on the top edge
  gridColor: 'lavender',                          // paint the whole frame
  cells:     { metrics: { color: 'azure' } },     // paint interior content
});
```

### Explicit mode — when you want full control

```js
const lo = new Layout({
  rows: [3, '*', 1],
  cols: [28, '*'],
  cells: {
    header:  { row: 0, col: [0, 1] },
    sidebar: { row: 1, col: 0, title: 'metrics' },
    main:    { row: 1, col: 1, title: 'events'  },
    footer:  { row: 2, col: [0, 1] },
  },
  gridBorder: 'rounded',
  gridColor:  'lavender',
});
```

**Track specs** — `number` (fixed), `"*"` or `"N*"` (flex), `"40%"` (percent). The last flex track absorbs rounding drift.

**Cell content** — `string`, `string[]`, or `() => string | string[]`. Functions re-invoke on every `render()` so you can point a cell at live state.

**Diffed rendering** — Layout caches each cell's last rendered lines and only rewrites the ones that actually changed. Updating one cell in a busy dashboard doesn't flicker the rest of the screen.

**Resize-aware** — `SIGWINCH` triggers a full repaint with re-resolved track sizes.

**Non-TTY fallback** — each cell prints sequentially with a header label, so piped output stays readable.

---

## Prompts

Zero-dependency interactive prompts. Arrow keys, backspace, Ctrl+C safe. Non-TTY environments automatically return defaults.

### confirm

```js
import { confirm } from '@nijil71/lumi-cli';

const ok = await confirm('Deploy to production?');
// ? Deploy to production?  Y/n
// ✔ Deploy to production?  yes
```

### select

```js
import { select } from '@nijil71/lumi-cli';

const env = await select('Target environment:', ['dev', 'staging', 'production'], {
  default: 'staging',
});
// ? Target environment?
//   ❯ staging          ← arrow keys to move, Enter to select
//     production
```

### input

```js
import { input } from '@nijil71/lumi-cli';

const tag   = await input('Release tag:',  { default: 'v1.0.0' });
const token = await input('API token:',    { password: true });
// ✔ Release tag:   v1.0.0
// ✔ API token:     ●●●●●●●●●●●●
```

Non-TTY fallback: all prompts immediately return their `default` value with a `[non-interactive]` notice — clean behavior in CI.

---

## Hyperlinks

OSC 8 clickable links, supported in iTerm2, WezTerm, Windows Terminal, Kitty, GNOME Terminal 3.26+. Falls back to plain visible text elsewhere.

```js
import { ansi, writeln, c } from '@nijil71/lumi-cli';

writeln(`Docs: ${ansi.link(`${c.azure}lumi-cli on GitHub${c.r}`, 'https://github.com/nijil71/Lumi')}`);
```

---

## CLI

```bash
npx lumi demo                  # full cinematic showcase
npx lumi demo prompts          # interactive prompts demo (live input)
npx lumi demo spinners         # just spinners
npx lumi demo pets             # cute pet spinners 🐾
npx lumi demo progress         # just progress bars
npx lumi demo tree diff        # multiple sections
npx lumi demo --slow           # presentation mode
npx lumi demo --fast           # skim mode
npx lumi --version
npx lumi --help
```

---

## Why lumi-cli instead of chalk + ora + boxen?

| | **lumi-cli** | chalk + ora + boxen + cli-progress |
|---|:---:|:---:|
| Install size | **~30 KB** | ~150 KB+ |
| Runtime deps | **0** | 15+ transitive |
| Prompts | ✔ 5 types (`input`, `select`, `multiSelect`, `autocomplete`, `confirm`) | prompts — separate |
| Task Runner | ✔ `TaskRunner` | listr2 — 30+ transitive |
| Pager | ✔ Alternate screen `pager` | less - external |
| Progress bars | ✔ 6 styles | cli-progress — separate |
| Boxes | ✔ 6 borders | boxen — separate |
| Tables | ✔ 4 borders | cli-table3 — separate |
| ASCII banners | ✔ custom glyphs | figlet — 2.8 MB |
| Gradient text | ✔ built-in | not available |
| Spinners | ✔ 25 types (+ 11 pets 🐾) | ora — separate |
| Sparklines | ✔ built-in | not available |
| Tree renderer | ✔ built-in | not available |
| Diff viewer | ✔ built-in | not available |
| Status bar | ✔ built-in | not available |
| Grid layout / dashboard | ✔ built-in | blessed / neo-blessed — heavy |
| Sketch-to-layout (wireframe DSL) | ✔ built-in | not available |
| Shared-border grid with T-junctions | ✔ built-in | not available |
| Interactive prompts | ✔ built-in | inquirer — separate |
| OSC 8 hyperlinks | ✔ built-in | not available |
| Consistent palette | ✔ shared system | DIY |
| TypeScript types | ✔ full .d.ts | varies |

**Trade-off:** lumi-cli is opinionated — one palette, one style system. If you need 1000 Figlet fonts, a color picker widget, or complex form validation, use dedicated packages. If you want everything to just work, consistently, from one import — use lumi-cli.

---

## License
This project is licensed under the [MIT License](LICENSE).
