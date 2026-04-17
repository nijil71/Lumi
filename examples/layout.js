// ─── Layout demo — sketch-driven dashboard ──────────────────────────────
// Run:  node examples/layout.js
// Quit: Ctrl+C
//
// The shape you draw IS the layout you get: border style, track sizes,
// cell spans — all parsed from the wireframe below.

import { Layout, sparkline, c, gradient, GRADIENTS } from '../src/index.js';

const lo = Layout.sketch`
  ╭────────────────────────────────────────────────────────╮
  │                         header                         │
  ├────────────────────┬───────────────────────────────────┤
  │                    │                                   │
  │                    │                                   │
  │      metrics       │              events               │
  │                    │                                   │
  │                    │                                   │
  │                    │                                   │
  │                    │                                   │
  │                    │                                   │
  │                    │                                   │
  │                    │                                   │
  ├────────────────────┴───────────────────────────────────┤
  │                         footer                         │
  ╰────────────────────────────────────────────────────────╯
`;

lo.start();

lo.set('header', () =>
  gradient('  LUMI DASHBOARD · press Ctrl+C to quit', ...GRADIENTS.neon)
);

lo.set('footer', `${c.d}tip: resize the terminal — grid reflows and repaints only what changed${c.r}`);

// Rolling series for the metrics pane
const cpu = Array.from({ length: 24 }, () => Math.random() * 100);
const mem = Array.from({ length: 24 }, () => 40 + Math.random() * 40);
const req = Array.from({ length: 24 }, () => Math.random() * 200);

// Event log tail
const events  = [];
const sources = ['api', 'db ', 'svc', 'web', 'job'];
const verbs   = ['started', 'ok     ', 'retried', 'queued ', 'closed ', 'slow   '];

setInterval(() => {
  cpu.shift(); cpu.push(Math.random() * 100);
  mem.shift(); mem.push(40 + Math.random() * 40);
  req.shift(); req.push(Math.random() * 200);

  const src  = sources[Math.floor(Math.random() * sources.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const ms   = (Math.random() * 80).toFixed(0).padStart(3, ' ');
  events.push(
    `${c.slate}${new Date().toTimeString().slice(0, 8)}${c.r}  ` +
    `${c.azure}${src}${c.r}  ${verb} ${c.d}${ms}ms${c.r}`
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
}, 200);

process.on('SIGINT', () => { lo.stop(); process.exit(0); });
