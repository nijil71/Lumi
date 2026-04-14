# lumi-cli

Terminal UI components — spinners, progress bars, boxes, tables, banners — with zero runtime dependencies.

```
npm install lumi-cli
```

> **Node.js ≥ 18** required. Pure ESM — no CommonJS export.

---

## Install & run

```bash
npm install lumi-cli

# see everything in action
npx lumi demo
```

---

## Usage

```js
import { spinner, progressBar, box, table, banner, log } from 'lumi-cli';
```

### Spinners

```js
import { Spinner } from 'lumi-cli';

const sp = new Spinner({ type: 'braille', text: 'Compiling...', color: 'azure' });
sp.start();
// ... do work ...
sp.succeed('Compiled in 1.2s');
```

End states: `sp.succeed(text)`, `sp.fail(text)`, `sp.warn(text)`, `sp.info(text)`.

**Elapsed time** — shows how long the spinner has been running:

```js
const sp = new Spinner({ text: 'Building', elapsed: true });
```

**Wrap a promise:**

```js
import { Spinner } from 'lumi-cli';

await Spinner.promise(fetchData(), { text: 'Fetching data...', color: 'sage' });
```

**Run multiple spinners simultaneously:**

```js
import { MultiSpinner } from 'lumi-cli';

const multi = new MultiSpinner();
const a = multi.add({ type: 'braille', text: 'Compiling',  color: 'azure' });
const b = multi.add({ type: 'dash',    text: 'Bundling',   color: 'lavender' });
multi.start();

// resolve independently
multi.succeed(a, 'Compiled — 0 errors');
multi.fail(b, '3 bundle warnings');
multi.stop();
```

**12 spinner types:**

| name | frames | interval |
|------|--------|----------|
| `braille` | ⠋⠙⠹⠸⠼⠴⠦ | 80ms |
| `block` | ▏▎▍▌▋▊▉█ | 120ms |
| `dash` | ▰▱▱▱ → ▰▰▰▰ | 90ms |
| `orbital` | ◜◝◞◟ | 100ms |
| `pulse` | ·•●◉●•· | 180ms |
| `grid` | ⣾⣽⣻⢿⡿⣟ | 130ms |
| `triangle` | ◢◣◤◥ | 100ms |
| `snake` | ⠁⠂⠄⡀⢀⠠ | 70ms |
| `signal` | · ·· ··· | 200ms |
| `cross` | ┼╋┿╈╉╊ | 150ms |
| `morph` | ◰◳◲◱ | 150ms |
| `clock` | 🕛🕐🕑🕒 | 100ms |

---

### Progress bars

```js
import { ProgressBar } from 'lumi-cli';

const bar = new ProgressBar({
  total: 100,
  style: 'bracket',   // block | shaded | bracket | thin | brutalist | dots
  color: 'azure',     // chalk | signal | sage | azure | amber | lavender
  label: 'uploading',
  eta:   true,         // show estimated time remaining
  rate:  true,         // show items/sec
});

bar.start();
bar.update(50);
bar.increment(10);
bar.complete('Upload done');
```

**Multiple bars at once:**

```js
import { MultiBar } from 'lumi-cli';

const mb = new MultiBar();
const a = mb.add({ total: 100, style: 'block',  label: 'kernel.img' });
const b = mb.add({ total: 200, style: 'shaded', label: 'assets.tar' });
mb.start();
mb.update(a, 60);
mb.update(b, 140);
mb.tick();
mb.stop();
```

---

### Boxes

```js
import { box } from 'lumi-cli';

box('Hello from lumi.', {
  border:  'single',   // single | double | rounded | thick | dashed | ascii
  color:   'chalk',
  title:   'NOTE',
  footer:  'v1.0.0',
  padding: 1,
  width:   60,
  align:   'left',     // left | center | right
});
```

---

### Tables

```js
import { table } from 'lumi-cli';

table([
  { name: 'alpha', version: '1.0.0', status: 'stable' },
  { name: 'beta',  version: '2.1.3', status: 'rc' },
], {
  border: 'single',    // single | thick | double | minimal
  align: { version: 'right' },  // per-column alignment
  maxWidth: { name: 20 },       // truncate long values
});
```

---

### Banner

Block-letter ASCII art using a custom 5×5 glyph set. Supports A–Z, 0–9, and basic punctuation.

```js
import { banner, divider, header, badge } from 'lumi-cli';

banner('DONE', { color: 'sage', align: 'center' });

divider({ label: 'SECTION', char: '─' });

header('logging', 'structured output');

console.log(`Release ${badge('v1.0.0', { type: 'success' })} is live`);
```

---

### Logger

```js
import { log, createLogger } from 'lumi-cli';

log.info('Server starting');
log.success('Listening on :3000');
log.warn('High memory usage');
log.error('Unhandled rejection');
log.debug('Event loop lag: 2ms');

// key-value pairs
log.kv('NODE_ENV', 'production');
log.kv('PORT',     '3000');

// step sequences
log.step(1, 8, 'Checkout repository');
log.step(2, 8, 'Install dependencies');

// named logger with timestamps
const api = createLogger({ prefix: 'api', timestamps: true });
api.info('Request received');
```

---

## Colors

7 named colors used across all components:

| name | use |
|------|-----|
| `chalk` | default text, high contrast |
| `signal` | errors, critical alerts |
| `sage` | success states |
| `azure` | info, links, active state |
| `amber` | warnings |
| `lavender` | accents, secondary actions |
| `dim` | muted, disabled |

Access palette colors for custom output:

```js
import { c, writeln } from 'lumi-cli';

writeln(`${c.signal}${c.b}CRITICAL${c.r} ${c.fog}something went wrong${c.r}`);
writeln(`${c.sage}✔${c.r} all systems nominal`);
```

---

## Terminal behavior

**Non-TTY mode**: When stdout isn't a terminal (piped, redirected, CI), interactive components degrade gracefully:
- Spinners print the final state only (no animation)
- Progress bars print at 25%, 50%, 75%, 100% instead of animating
- Colors are stripped

**NO_COLOR**: Set `NO_COLOR=1` to disable all color output ([no-color.org](https://no-color.org/)). Also respects `FORCE_COLOR` to override detection.

**Ctrl+C safety**: Spinners and progress bars restore the cursor on SIGINT — no more invisible cursors after cancellation.

---

## Why this instead of chalk + ora + boxen?

| | lumi-cli | chalk+ora+boxen+cli-progress |
|---|---|---|
| Install size | ~30KB | ~150KB+ |
| Dependencies | 0 | 15+ transitive |
| Spinners | ✔ built-in | ora (separate) |
| Progress | ✔ built-in | cli-progress (separate) |
| Boxes | ✔ built-in | boxen (separate) |
| Tables | ✔ built-in | cli-table3 (separate) |
| Banner art | ✔ custom glyphs | figlet (separate) |
| Consistent palette | ✔ shared | DIY |

Trade-offs: lumi-cli is opinionated — one palette, one style system. If you need full Figlet font support, 16M color pickers, or complex table layouts, use the dedicated packages.

---

## CLI

```bash
npx lumi demo           # run full showcase
npx lumi demo spinners  # just spinners
npx lumi demo progress  # just progress bars
npx lumi --version
npx lumi --help
```

---

## License

MIT
```

