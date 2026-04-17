import { Spinner, MultiSpinner } from '../src/index.js';

// Single Spinner
const sp = new Spinner({ type: 'wave', text: 'Building…', color: 'azure', elapsed: true });
sp.start();

setTimeout(() => {
  sp.succeed('Build complete — 1.2s');
  
  // Multi Spinner
  const multi = new MultiSpinner();
  const a = multi.add({ type: 'braille', text: 'Compiling', color: 'azure' });
  const b = multi.add({ type: 'cyber', text: 'Testing', color: 'lavender' });
  
  multi.start();
  setTimeout(() => multi.succeed(a, 'Compiled'), 1000);
  setTimeout(() => { multi.fail(b, '3 failures'); multi.stop(); }, 1500);

}, 1500);
