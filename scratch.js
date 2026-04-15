import { Spinner } from './src/spinners/index.js';

const tempSpinners = {
  dots:      { interval: 80,  frames: ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'] },
  minimal:   { interval: 100, frames: ['—', '\\', '|', '/'] },
  arc:       { interval: 100, frames: ['◜', '◠', '◝', '◞', '◡', '◟'] },
  material:  { interval: 100, frames: ['█', '▓', '▒', '░', '▒', '▓'] },
  wave:      { interval: 80,  frames: [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'] },
  meter:     { interval: 140, frames: ['▱▱▱', '▰▱▱', '▰▰▱', '▰▰▰', '▰▰▱', '▰▱▱'] },
  liquid:    { interval: 100, frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'] },
  cube:      { interval: 120, frames: ['▖', '▘', '▝', '▗'] },
  pulse:     { interval: 150, frames: ['·', '•', '●', '•'] },
  moon:      { interval: 100, frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'] },
  bounce:    { interval: 100, frames: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'] },
  glitch:    { interval: 80,  frames: ['▄', '▀', '▌', '▐'] }
};

async function testItems() {
  for (const [key, value] of Object.entries(tempSpinners)) {
    const sp = new Spinner({ type: 'dots', text: key });
    sp._def = value;
    sp.start();
    await new Promise(r => setTimeout(r, 1000));
    sp.succeed(`${key} done`);
  }
}

testItems();
