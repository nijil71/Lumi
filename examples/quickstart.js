// ─── lumi-cli · quickstart ──────────────────────────────────────────────────
//
// A 60-second tour. Fake "deploy" script that uses the six most-reached-for
// lumi components — spinner, progress, logger, box, table, banner — in one
// realistic flow so you can see how they compose.
//
//   Run here:             node examples/quickstart.js
//   Copy to your project: change the import below to '@nijil71/lumi-cli'
//                         (works in both `import` and `require` projects)
//
// ───────────────────────────────────────────────────────────────────────────

import {
  banner, box, table,
  Spinner, ProgressBar,
  log, c, gradient, GRADIENTS,
} from '../src/index.js';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// 1) Splash — gradient banner + subtitle
banner('DEPLOY', { gradient: GRADIENTS.neon, align: 'center' });
console.log();

// 2) log.step gives you a numbered, human-readable phase marker.
log.step(1, 4, 'Checking git status');
await wait(350);
log.success('clean working tree');

// 3) Spinner.promise wraps any async op — auto-starts, prints the success/fail
//    line when the promise settles, shows elapsed time when you ask.
log.step(2, 4, 'Running tests');
await Spinner.promise(wait(900), {
  text:        'running 42 tests',
  successText: '42 passed · 0 failed',
  color:       'sage',
  elapsed:     true,
});

// 4) ProgressBar for anything with a known total. ETA + rate come for free.
log.step(3, 4, 'Building bundle');
const bar = new ProgressBar({
  total: 100, style: 'block', color: 'azure',
  label: 'node_modules/app/bundle.tar.gz',  // long label auto-ellipsizes
  eta: true, rate: true,
});
bar.start();
for (let i = 0; i <= 100; i += 4) { bar.update(i); await wait(18); }
bar.complete('built · 170 KB');

// 5) Another Spinner.promise — shows how they stack visually (elapsed aligned).
log.step(4, 4, 'Uploading to CDN');
await Spinner.promise(wait(650), {
  text:        'uploading to ap-south-1',
  successText: 'live at https://app.example.com',
  color:       'lavender',
  elapsed:     true,
});

// 6) Table — aligned, truncated. Per-column align + maxWidth are the usual knobs.
console.log();
table(
  [
    { file: 'app.js',              size: '42 KB',  gzip: '14 KB' },
    { file: 'vendor.js',           size: '120 KB', gzip: '38 KB' },
    { file: 'styles.css',          size: '8 KB',   gzip: '2 KB'  },
    { file: 'very_long_filename_that_will_be_truncated.js', size: '4 KB', gzip: '1 KB' },
  ],
  {
    border: 'single',
    align: { size: 'right', gzip: 'right' },
    maxWidth: { file: 32 },          // truncated cells get a ▸ wedge
  }
);

// 7) Final box — rounded frame, lavender border, inline title, padded.
console.log();
box(
  [
    `${c.sage}✓${c.r}  deployed to ${c.azure}production${c.r}`,
    '',
    `${c.d}build time:${c.r}  3.2s`,
    `${c.d}bundle:    ${c.r}  170 KB  (54 KB gzip)`,
    `${c.d}url:       ${c.r}  https://app.example.com`,
  ],
  { border: 'rounded', color: 'lavender', title: 'COMPLETE', padding: 1, width: 52 }
);
console.log();
console.log(gradient('  done — that\'s six components in one script.', ...GRADIENTS.neon));
console.log();
