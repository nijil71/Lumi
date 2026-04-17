import { ProgressBar, MultiBar } from '../src/index.js';

// Single Progress Bar
const bar = new ProgressBar({
  total: 100,
  style: 'wave',
  color: 'azure',
  label: 'uploading',
  eta: true,
  rate: true,
});

bar.start();

let progress = 0;
const timer = setInterval(() => {
  progress += 5;
  bar.update(progress);
  if (progress >= 100) {
    clearInterval(timer);
    bar.complete('Done');
    
    // Switch to multi-bar
    runMultiBar();
  }
}, 100);

function runMultiBar() {
  const mb = new MultiBar();
  const a = mb.add({ total: 100, style: 'block', label: 'kernel.img', color: 'azure' });
  const b = mb.add({ total: 100, style: 'shaded', label: 'node_modules', color: 'lavender' });
  
  mb.start();
  let progressA = 0;
  let progressB = 0;
  
  const mTimer = setInterval(() => {
    progressA = Math.min(100, progressA + 8);
    progressB = Math.min(100, progressB + 4);
    
    mb.update(a, progressA);
    mb.update(b, progressB);
    mb.tick();
    
    if (progressA >= 100 && progressB >= 100) {
      clearInterval(mTimer);
      mb.stop();
    }
  }, 100);
}
