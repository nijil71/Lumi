// ─── lumi-cli / spinners ────────────────────────────────────────────────

import { write, writeln, ansi, c as colors, isTTY, getColorTheme } from '../ansi.js';

export const SPINNERS = {
  // — originals —
  braille:  { interval: 80,  frames: ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'] },
  block:    { interval: 120, frames: ['▏','▎','▍','▌','▋','▊','▉','█','▉','▊','▋','▌','▍','▎'] },
  cross:    { interval: 150, frames: ['┼','╋','┿','╈','╉','╊','╋','┿','╇','╆','╅','╄','╃','╂'] },
  orbital:  { interval: 100, frames: ['◜','◝','◞','◟'] },
  pulse:    { interval: 180, frames: ['·','•','●','◉','●','•','·'] },
  dash:     { interval: 90,  frames: ['▰▱▱▱▱▱▱','▰▰▱▱▱▱▱','▰▰▰▱▱▱▱','▰▰▰▰▱▱▱','▰▰▰▰▰▱▱','▰▰▰▰▰▰▱','▰▰▰▰▰▰▰','▱▰▰▰▰▰▰','▱▱▰▰▰▰▰','▱▱▱▰▰▰▰','▱▱▱▱▰▰▰','▱▱▱▱▱▰▰','▱▱▱▱▱▱▰'] },
  grid:     { interval: 130, frames: ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'] },
  triangle: { interval: 100, frames: ['◢','◣','◤','◥'] },
  snake:    { interval: 70,  frames: ['⠁⠂⠄⡀⢀⠠⠐⠈','⠂⠄⡀⢀⠠⠐⠈⠁','⠄⡀⢀⠠⠐⠈⠁⠂','⡀⢀⠠⠐⠈⠁⠂⠄','⢀⠠⠐⠈⠁⠂⠄⡀','⠠⠐⠈⠁⠂⠄⡀⢀','⠐⠈⠁⠂⠄⡀⢀⠠','⠈⠁⠂⠄⡀⢀⠠⠐'] },
  signal:   { interval: 200, frames: ['·  ','·· ','···','·· ','·  ','   '] },
  clock:    { interval: 100, frames: ['🕛','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚'] },
  morph:    { interval: 150, frames: ['◰','◳','◲','◱'] },

  // — new —
  arc:      { interval: 100, frames: ['◐','◓','◑','◒'] },
  line:     { interval: 80,  frames: ['|','/','-','\\'] },
  star:     { interval: 100, frames: ['✶','✸','✹','✺','✹','✷'] },
  wave:     { interval: 80,  frames: ['▁▂▃▄▅▆▇█','▂▃▄▅▆▇█▇','▃▄▅▆▇█▇▆','▄▅▆▇█▇▆▅','▅▆▇█▇▆▅▄','▆▇█▇▆▅▄▃','▇█▇▆▅▄▃▂','█▇▆▅▄▃▂▁'] },
  balloon:  { interval: 140, frames: ['.','o','O','@','*','O','o','.'] },
  cyber:    { interval: 70,  frames: ['⣿','⣾','⣼','⣸','⢸','⡸','⡰','⡠','⡀','⢀','⣀','⣄','⣆','⣇','⣏','⣟'] },
  flip:     { interval: 110, frames: ['_','_','_','-','`','\'','´','‾','-','_','_'] },
  meter:    { interval: 100, frames: ['▱▱▱▱▱','▰▱▱▱▱','▰▰▱▱▱','▰▰▰▱▱','▰▰▰▰▱','▰▰▰▰▰','▰▰▰▰▱','▰▰▰▱▱','▰▰▱▱▱','▰▱▱▱▱'] },

  // — action pets (single line, highly dynamic) —
  catChase: { interval: 100, frames: ['(=^･ω･^=)       🐁', ' (=^･ω･^=)      🐁', '  (=^･ω･^=)     🐁', '   (=^･ω･^=)    🐁', '    (=^･ω･^=)   🐁', '     (=^･ω･^=)  🐁', '      (=^･ω･^=) 🐁', '       (=^>ω<^=)🐁', '       (=^>ω<^=)', '      (=^-ω-^=) ', '    (=^-ω-^=)   ', '  (=^-ω-^=)     '] },
  dogFetch: { interval: 150, frames: ['( ᐡ • ﻌ • ᐡ )   🎾', '( ᐡ > ﻌ < ᐡ )  🎾 ', '( ᐡ • ﻌ • ᐡ ) 🎾  ', '( ᐡ > ﻌ < ᐡ )🎾   ', '( ᐡ ^ ﻌ ^ ᐡ )     ', '( ᐡ > ﻌ < ᐡ )🎾   ', '( ᐡ • ﻌ • ᐡ ) 🎾  ', '( ᐡ > ﻌ < ᐡ )  🎾 '] },
  bunnyEat: { interval: 180, frames: ['₍ᐢ•ﻌ•ᐢ₎ 🥕', '₍ᐢ>ﻌ<ᐢ₎ 🥕', '₍ᐢ•ﻌ•ᐢ₎ 🥕', '₍ᐢ-ﻌ-ᐢ₎ 🥕', '₍ᐢ^ﻌ^ᐢ₎ 🥕', '₍ᐢ>ﻌ<ᐢ₎   '] },
  fishSwim: { interval: 150, frames: ['     ϵ( \'Θ\' )϶  ', '   °  ϵ( °Θ° )϶ ', ' ∘  ° ϵ( \'Θ\' )϶ ', '   ∘  ϵ( °Θ° )϶ ', '     ϵ( >Θ< )϶  ', '     ϵ( \'Θ\' )϶  '] },
  bearHoney:{ interval: 200, frames: ['ʕ •ᴥ• ʔ  🍯', 'ʕ >ᴥ< ʔ  🍯', 'ʕ ^ᴥ^ ʔ 🍯 ', 'ʕ -ᴥ- ʔ🍯  ', 'ʕ >ᴥ< ʔ    '] },
  caterpillar:{ interval: 80, frames: ['🐛        ', ' 🐛       ', '  🐛      ', '   🐛     ', '    🐛    ', '     🐛   ', '      🐛  ', '       🐛 ', '        🐛'] },

  // — multi-line pets (large, expressive) —
  catWalk: { interval: 200, frames: [
    '  /\\_/\\  \n =( °w° )=\n  )   ( //\n (__ __)// ',
    '  /\\_/\\  \n =( °w° )=\n \\\\)   (  \n \\\\(__ __) ',
    '  /\\_/\\  \n =( -w- )=\n  )   ( //\n (__ __)// ',
    '  /\\_/\\  \n =( °w° )=\n \\\\)   (  \n \\\\(__ __) ',
  ]},
  dogWag: { interval: 180, frames: [
    '  ∪・ω・∪  \n / |    |\\~\n   |    |   \n   d    b   ',
    '  ∪・ω・∪  \n / |    | \\~\n   |    |   \n   d    b   ',
    '  ∪・ω・∪  \\~\n / |    |  \n   |    |   \n   d    b   ',
    '  ∪・ω・∪  \n / |    | \\~\n   |    |   \n   d    b   ',
    ' \\~∪・ω・∪  \n / |    |  \n   |    |   \n   d    b   ',
  ]},
  bunnyHop: { interval: 200, frames: [
    ' (\\(\\   \n ( -.-)  \n o_(")(") ',
    ' (\\(\\   \n ( °.°)  \n o_(")(") ',
    '  (\\(\\  \n  ( °.°) \n  (")(") ',
    '   (\\(\\ \n   ( -.-)   \n  o_(")(")',
  ]},
  birdFlap: { interval: 150, frames: [
    '   ,_,   \n  (o.o)  \n /( _ )\\ \n   ˬ ˬ   ',
    '   ,_,   \n  (o.o)  \n  ( _ )  \n / ˬ ˬ \\ ',
    '   ,_,   \n  (o.o)  \n\\( _ ) / \n   ˬ ˬ   ',
    '   ,_,   \n  (o.o)  \n  ( _ )  \n / ˬ ˬ \\ ',
  ]},
  turtleCrawl: { interval: 250, frames: [
    '    _____     \n  /       \\   \n |  °  °  |_  \n |   __   / \\ \n  \\_____/ ︢ ︢ ',
    '    _____     \n  /       \\   \n |  -  -  |_  \n |   __   / \\ \n  \\_____/︢ ︢  ',
    '    _____     \n  /       \\   \n |  °  °  |_  \n |   __   / \\ \n  \\_____/ ︢ ︢ ',
    '    _____     \n  /       \\   \n |  °  °  |_  \n |   __   / \\ \n  \\_____/  ︢ ︢',
  ]},
};

// ─── SIGINT cleanup registry ──────────────────────────────────────────────
// All active spinners register here so Ctrl+C restores the cursor.

const activeInstances = new Set();
let sigintBound = false;

function ensureSigintHandler() {
  if (sigintBound) return;
  sigintBound = true;
  process.on('SIGINT', () => {
    for (const instance of activeInstances) {
      instance.stop();
    }
    write(ansi.show());
    process.exit(130);
  });
}

function formatElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

// ─── Spinner ──────────────────────────────────────────────────────────────

export class Spinner {
  constructor(options = {}) {
    this._def     = SPINNERS[options.type || 'braille'] || SPINNERS.braille;
    this._text    = options.text   || '';
    this._colorFn = getColorTheme(options.color || 'default');
    this._frame   = 0;
    this._timer   = null;
    this._prefix  = options.prefix || '';
    this._elapsed = options.elapsed || false;
    this._startMs = null;
    // Multi-line support for pet spinners
    this._multiLine = this._def.frames.some(f => f.includes('\n'));
    this._renderedLines = 0;
  }

  _render() {
    const frame   = this._def.frames[this._frame % this._def.frames.length];
    const prefix  = this._prefix ? `${colors.slate}${colors.b}${this._prefix}${colors.r} ` : '';
    let text    = this._text   ? ` ${colors.fog}${this._text}${colors.r}` : '';

    if (this._elapsed && this._startMs) {
      const elapsed = Date.now() - this._startMs;
      text += ` ${colors.slate}${formatElapsed(elapsed)}${colors.r}`;
    }

    if (this._multiLine) {
      // Multi-line pet spinner: clear previous frame, then draw each line
      if (this._renderedLines > 0) {
        write(ansi.up(this._renderedLines));
      }
      const lines = frame.split('\n');
      for (let i = 0; i < lines.length; i++) {
        write(ansi.col(1) + ansi.clearLine() + `  ${this._colorFn(lines[i])}` + '\n');
      }
      // Print status text on its own line below the pet
      write(ansi.col(1) + ansi.clearLine() + `${prefix}${colors.fog}⠿${colors.r}${text}`);
      this._renderedLines = lines.length;
    } else {
      const spinner = this._colorFn(frame);
      write(ansi.col(1) + ansi.clearLine() + `${prefix}${spinner}${text}`);
    }
    this._frame++;
  }

  start(text) {
    if (text !== undefined) this._text = text;
    this._startMs = Date.now();

    // Non-TTY: skip animation entirely
    if (!isTTY()) {
      return this;
    }

    ensureSigintHandler();
    activeInstances.add(this);
    write(ansi.hide());

    // Pre-allocate lines for multi-line spinners so first render doesn't jump
    if (this._multiLine) {
      const frameLines = this._def.frames[0].split('\n').length;
      for (let i = 0; i < frameLines + 1; i++) write('\n'); // +1 for status text line
      this._renderedLines = frameLines;
    }

    this._timer = setInterval(() => this._render(), this._def.interval);
    this._render();
    return this;
  }

  setText(t)     { this._text = t; return this; }
  setColor(name) { this._colorFn = getColorTheme(name); return this; }

  succeed(text) { this._stop(`${colors.sage}✔${colors.r}`,   text || this._text); }
  fail(text)    { this._stop(`${colors.signal}✘${colors.r}`, text || this._text); }
  warn(text)    { this._stop(`${colors.amber}⚠${colors.r}`,  text || this._text); }
  info(text)    { this._stop(`${colors.azure}ℹ${colors.r}`,  text || this._text); }

  _stop(symbol, text) {
    clearInterval(this._timer);
    activeInstances.delete(this);

    let elapsed = '';
    if (this._elapsed && this._startMs) {
      elapsed = ` ${colors.slate}${formatElapsed(Date.now() - this._startMs)}${colors.r}`;
    }

    if (isTTY()) {
      // Clear all lines from a multi-line pet spinner
      if (this._multiLine && this._renderedLines > 0) {
        write(ansi.up(this._renderedLines));
        for (let i = 0; i <= this._renderedLines; i++) {
          write(ansi.col(1) + ansi.clearLine() + '\n');
        }
        write(ansi.up(this._renderedLines + 1));
      }
      write(ansi.col(1) + ansi.clearLine());
    }
    write(`${symbol} ${colors.chalk}${text}${colors.r}${elapsed}\n`);
    write(ansi.show());
  }

  stop() {
    clearInterval(this._timer);
    activeInstances.delete(this);
    if (isTTY()) {
      // Clear all lines from a multi-line pet spinner
      if (this._multiLine && this._renderedLines > 0) {
        write(ansi.up(this._renderedLines));
        for (let i = 0; i <= this._renderedLines; i++) {
          write(ansi.col(1) + ansi.clearLine() + '\n');
        }
        write(ansi.up(this._renderedLines + 1));
      }
      write(ansi.col(1) + ansi.clearLine());
    }
    write(ansi.show());
  }

  /**
   * Wrap a promise — start spinner, resolve/reject, print result.
   * Usage: await Spinner.promise(fetchData(), { text: 'Fetching...' })
   */
  static async promise(promise, options = {}) {
    const sp = new Spinner(options);
    sp.start();
    try {
      const result = await promise;
      sp.succeed(options.successText || options.text || 'Done');
      return result;
    } catch (err) {
      sp.fail(options.failText || err.message || 'Failed');
      throw err;
    }
  }
}

export function spinner(textOrOptions) {
  if (typeof textOrOptions === 'string') return new Spinner({ text: textOrOptions });
  return new Spinner(textOrOptions);
}

// ─── MultiSpinner ─────────────────────────────────────────────────────────

export class MultiSpinner {
  constructor() {
    this._spinners = [];
    this._timer    = null;
    this._lines    = 0;
  }

  add(textOrOptions) {
    const opts = typeof textOrOptions === 'string' ? { text: textOrOptions } : textOrOptions;
    this._spinners.push({
      def:     SPINNERS[opts.type || 'braille'] || SPINNERS.braille,
      text:    opts.text || '',
      frame:   0,
      colorFn: getColorTheme(opts.color || 'default'),
      status:  'spinning',
      symbol:  null,
    });
    return this._spinners.length - 1;
  }

  succeed(idx, text) { this._resolve(idx, `${colors.sage}✔${colors.r}`,   text, 'done'); }
  fail(idx, text)    { this._resolve(idx, `${colors.signal}✘${colors.r}`, text, 'fail'); }
  warn(idx, text)    { this._resolve(idx, `${colors.amber}⚠${colors.r}`,  text, 'warn'); }
  info(idx, text)    { this._resolve(idx, `${colors.azure}ℹ${colors.r}`,  text, 'info'); }

  _resolve(idx, symbol, text, status) {
    const s = this._spinners[idx];
    if (!s) return;
    s.status = status;
    s.symbol = symbol;
    if (text !== undefined) s.text = text;
  }

  _renderAll() {
    if (this._lines > 0) write(ansi.up(this._lines));
    for (const s of this._spinners) {
      write(ansi.col(1) + ansi.clearLine());
      if (s.status === 'spinning') {
        const frame = s.def.frames[s.frame % s.def.frames.length];
        write(`  ${s.colorFn(frame)} ${colors.fog}${s.text}${colors.r}\n`);
        s.frame++;
      } else {
        write(`  ${s.symbol} ${colors.chalk}${s.text}${colors.r}\n`);
      }
    }
    this._lines = this._spinners.length;
  }

  start() {
    // Non-TTY: skip animation
    if (!isTTY()) {
      return this;
    }

    ensureSigintHandler();
    activeInstances.add(this);
    write(ansi.hide());
    for (let i = 0; i < this._spinners.length; i++) write('\n');
    this._lines = this._spinners.length;
    this._timer = setInterval(() => this._renderAll(), 80);
    this._renderAll();
    return this;
  }

  stop() {
    clearInterval(this._timer);
    activeInstances.delete(this);

    if (isTTY()) {
      this._renderAll();
    } else {
      // Non-TTY: print final states
      for (const s of this._spinners) {
        const sym = s.symbol || (s.status === 'spinning' ? '·' : '✔');
        writeln(`  ${sym} ${s.text}`);
      }
    }
    write(ansi.show());
  }
}
