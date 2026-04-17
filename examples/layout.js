// ─── Layout demo — a mini dashboard ───────────────────────────────────────
// Run:  node examples/layout.js
// Quit: Ctrl+C

import { Layout, sparkline, c, gradient, GRADIENTS } from '../src/index.js';

const lo = new Layout({
  rows: [3, '*', 1],
  cols: [28, '*'],
  cells: {
    header:  { row: 0, col: [0, 1], border: 'rounded', color: 'lavender', title: 'lumi · layout demo' },
    sidebar: { row: 1, col: 0,      border: 'single',  color: 'azure',    title: 'Metrics' },
    main:    { row: 1, col: 1,      border: 'single',  color: 'sage',     title: 'Event stream' },
    footer:  { row: 2, col: [0, 1] },
  },
});

lo.start();

// Static header — gradient banner
lo.set('header', gradient('DASHBOARD · press Ctrl+C to quit', ...GRADIENTS.neon));
lo.set('footer', `${c.d}tip: resize the terminal — layout reflows automatically${c.r}`);

// Rolling data for the sidebar sparklines
const cpuSeries  = Array.from({ length: 20 }, () => Math.random() * 100);
const memSeries  = Array.from({ length: 20 }, () => 40 + Math.random() * 40);
const reqSeries  = Array.from({ length: 20 }, () => Math.random() * 200);

// Event log tail for the main cell
const events = [];
const sources   = ['api', 'db ', 'svc', 'web', 'job'];
const verbs     = ['started', 'ok', 'retried', 'queued', 'closed', 'slow'];

setInterval(() => {
  // advance metric series
  cpuSeries.shift(); cpuSeries.push(Math.random() * 100);
  memSeries.shift(); memSeries.push(40 + Math.random() * 40);
  reqSeries.shift(); reqSeries.push(Math.random() * 200);

  // append a random event
  const src  = sources[Math.floor(Math.random() * sources.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const ms   = (Math.random() * 80).toFixed(0).padStart(3, ' ');
  events.push(`${c.slate}${new Date().toTimeString().slice(0, 8)}${c.r}  ${c.azure}${src}${c.r}  ${verb.padEnd(8)} ${c.d}${ms}ms${c.r}`);
  if (events.length > 200) events.shift();

  // Functions recompute on every render — no imperative `.set` here.
  lo.set('sidebar', () => [
    '',
    `${c.chalk}CPU   ${c.r}${sparkline(cpuSeries, { color: 'azure'  })}  ${cpuSeries.at(-1).toFixed(0)}%`,
    `${c.chalk}MEM   ${c.r}${sparkline(memSeries, { color: 'sage'   })}  ${memSeries.at(-1).toFixed(0)}%`,
    `${c.chalk}REQ/s ${c.r}${sparkline(reqSeries, { color: 'amber'  })}  ${reqSeries.at(-1).toFixed(0)}`,
    '',
    `${c.d}updated ${new Date().toLocaleTimeString()}${c.r}`,
  ]);

  // Show the most recent events that fit — Layout clips overflow for us.
  lo.set('main', () => events.slice(-200));

  lo.render();
}, 200);

// Graceful exit — Layout also registers its own SIGINT cleanup, but this
// demonstrates the caller-side stop() path.
process.on('SIGINT', () => { lo.stop(); process.exit(0); });
