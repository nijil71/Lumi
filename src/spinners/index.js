// ─── lumi-cli / spinners ────────────────────────────────────────────────

import { write, writeln, ansi, c as colors, cols, visibleLen, isTTY, getColorTheme, registerCleanup } from '../ansi.js';

export const SPINNERS = {
  // ── core classics (earn their place) ──────────────────────────────────

  braille:  { interval: 80,  frames: ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'] },
  line:     { interval: 80,  frames: ['|','/','-','\\'] },
  arc:      { interval: 100, frames: ['◐','◓','◑','◒'] },
  grid:     { interval: 130, frames: ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'] },
  wave:     { interval: 80,  frames: ['▁▂▃▄▅▆▇█','▂▃▄▅▆▇█▇','▃▄▅▆▇█▇▆','▄▅▆▇█▇▆▅','▅▆▇█▇▆▅▄','▆▇█▇▆▅▄▃','▇█▇▆▅▄▃▂','█▇▆▅▄▃▂▁'] },
  cyber:    { interval: 70,  frames: ['⣿','⣾','⣼','⣸','⢸','⡸','⡰','⡠','⡀','⢀','⣀','⣄','⣆','⣇','⣏','⣟'] },
  snake:    { interval: 70,  frames: ['⠁⠂⠄⡀⢀⠠⠐⠈','⠂⠄⡀⢀⠠⠐⠈⠁','⠄⡀⢀⠠⠐⠈⠁⠂','⡀⢀⠠⠐⠈⠁⠂⠄','⢀⠠⠐⠈⠁⠂⠄⡀','⠠⠐⠈⠁⠂⠄⡀⢀','⠐⠈⠁⠂⠄⡀⢀⠠','⠈⠁⠂⠄⡀⢀⠠⠐'] },
  bounce:   { interval: 90,  frames: ['⠁','⠂','⠄','⠂'] },
  fade:     { interval: 110, frames: ['█','▓','▒','░','▒','▓'] },
  slash:    { interval: 80,  frames: ['╱','╲','╱','╲'] },
  grow:     { interval: 90,  frames: ['▏','▍','▋','█','▋','▍'] },
  ripple:   { interval: 100, frames: ['·','∘','○','◯','○','∘'] },
  // Runner
  runner:   { interval: 120, frames: ['ᗧ···','·ᗧ··','··ᗧ·','···ᗧ'] },
  // Heartbeat: lub-dub rhythm (quick double beat then rest)
  heartbeat:{ interval: 120, frames: ['♡', '♥', '♡', ' ', '♡', '♥', '♡', ' ', ' '] },


  // ── action pets (single line, highly dynamic) ─────────────────────────

  catChase:    { interval: 100, frames: ['(=^･ω･^=)       🐁',' (=^･ω･^=)      🐁','  (=^･ω･^=)     🐁','   (=^･ω･^=)    🐁','    (=^･ω･^=)   🐁','     (=^･ω･^=)  🐁','      (=^･ω･^=) 🐁','       (=^>ω<^=)🐁','       (=^>ω<^=)','      (=^-ω-^=) ','    (=^-ω-^=)   ','  (=^-ω-^=)     '] },
  dogFetch:    { interval: 150, frames: ['( ᐡ • ﻌ • ᐡ )   🎾','( ᐡ > ﻌ < ᐡ )  🎾 ','( ᐡ • ﻌ • ᐡ ) 🎾  ','( ᐡ > ﻌ < ᐡ )🎾   ','( ᐡ ^ ﻌ ^ ᐡ )     ','( ᐡ > ﻌ < ᐡ )🎾   ','( ᐡ • ﻌ • ᐡ ) 🎾  ','( ᐡ > ﻌ < ᐡ )  🎾 '] },
  bunnyEat:    { interval: 180, frames: ['₍ᐢ•ﻌ•ᐢ₎ 🥕','₍ᐢ>ﻌ<ᐢ₎ 🥕','₍ᐢ-ﻌ-ᐢ₎ 🥕','₍ᐢ^ﻌ^ᐢ₎ 🥕'] },
  fishSwim:    { interval: 150, frames: ['     ϵ( \'Θ\' )϶  ','   °  ϵ( °Θ° )϶ ',' ∘  ° ϵ( \'Θ\' )϶ ','   ∘  ϵ( °Θ° )϶ ','     ϵ( >Θ< )϶  ','     ϵ( \'Θ\' )϶  '] },
  bearHoney:   { interval: 200, frames: ['ʕ •ᴥ• ʔ  🍯','ʕ >ᴥ< ʔ  🍯','ʕ ^ᴥ^ ʔ 🍯 ','ʕ -ᴥ- ʔ🍯  ','ʕ >ᴥ< ʔ    '] },
  caterpillar: { interval: 80,  frames: ['🐛        ',' 🐛       ','  🐛      ','   🐛     ','    🐛    ','     🐛   ','      🐛  ','       🐛 ','        🐛'] },

  // ── multi-line pets (large, expressive) ──────────────────────────────

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


function formatElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

// ─── Spinner ──────────────────────────────────────────────────────────────

export class Spinner {
  constructor(options = {}) {
    const typeName = options.type || 'braille';
    if (!SPINNERS[typeName]) {
      throw new RangeError(`Spinner: unknown type "${typeName}" — expected one of ${Object.keys(SPINNERS).join(' | ')}`);
    }
    this._def     = SPINNERS[typeName];
    this._text    = options.text   || '';
    this._colorFn = getColorTheme(options.color || 'default');
    this._frame   = 0;
    this._timer   = null;
    this._prefix  = options.prefix || '';
    this._elapsed = options.elapsed || false;
    this._startMs = null;
    this._multiLine = this._def.frames.some(f => f.includes('\n'));
    this._renderedLines = 0;
    this._unregister = null;
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
      if (this._renderedLines > 0) {
        write(ansi.up(this._renderedLines));
      }
      const lines = frame.split('\n');
      for (let i = 0; i < lines.length; i++) {
        write(ansi.clearLine() + `  ${this._colorFn(lines[i])}` + '\n');
      }
      write(ansi.clearLine() + `${prefix}${colors.fog}⠿${colors.r}${text}`);
      this._renderedLines = lines.length;
    } else {
      const spinner = this._colorFn(frame);
      write(ansi.clearLine() + `${prefix}${spinner}${text}`);
    }
    this._frame++;
  }

  start(text) {
    if (text !== undefined) this._text = text;
    this._startMs = Date.now();

    if (!isTTY()) {
      return this;
    }

    this._unregister = registerCleanup(() => this._cleanup());
    write(ansi.hide());

    if (this._multiLine) {
      const frameLines = this._def.frames[0].split('\n').length;
      for (let i = 0; i < frameLines + 1; i++) write('\n');
      this._renderedLines = frameLines;
    }

    this._timer = setInterval(() => this._render(), this._def.interval);
    // keep node from holding the event loop open just for a spinner
    if (this._timer.unref) this._timer.unref();
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
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._unregister) { this._unregister(); this._unregister = null; }

    let elapsed = '';
    if (this._elapsed && this._startMs) {
      elapsed = `${colors.slate}${formatElapsed(Date.now() - this._startMs)}${colors.r}`;
    }

    if (isTTY()) {
      if (this._multiLine && this._renderedLines > 0) {
        write(ansi.up(this._renderedLines));
        write(ansi.clearDown());
      }
      write(ansi.clearLine());

      // Right-align the elapsed tail so stacked success lines line up their
      // timings into a column, df-style. Pick an alignment anchor that's
      // comfortable on 80-col terminals but grows with wider windows up to 60.
      const prefix = `${symbol} ${colors.chalk}${text}${colors.r}`;
      if (elapsed) {
        const pVis = visibleLen(prefix);
        const eVis = visibleLen(elapsed);
        const anchor = Math.min(cols() - 2, 60);
        const pad = Math.max(1, anchor - pVis - eVis);
        write(`${prefix}${' '.repeat(pad)}${elapsed}\n`);
      } else {
        write(`${prefix}\n`);
      }
      write(ansi.show());
    } else {
      // Non-TTY: write a plain settled line so piped logs capture the outcome.
      // Strip ANSI from symbol to keep log files clean.
      const plainSymbol = symbol.replace(/\x1b\[[0-9;]*m/g, '');
      const plainElapsed = elapsed.replace(/\x1b\[[0-9;]*m/g, '');
      writeln(`${plainSymbol} ${text}${plainElapsed ? `  ${plainElapsed}` : ''}`);
    }
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._unregister) { this._unregister(); this._unregister = null; }
    if (isTTY()) {
      if (this._multiLine && this._renderedLines > 0) {
        write(ansi.up(this._renderedLines));
        write(ansi.clearDown());
      }
      write(ansi.clearLine());
      write(ansi.show());
    }
  }

  /** Internal cleanup invoked on SIGINT / exit — just silences output. */
  _cleanup() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (isTTY()) {
      if (this._multiLine && this._renderedLines > 0) {
        write(ansi.up(this._renderedLines));
        write(ansi.clearDown());
      }
      write(ansi.clearLine());
    }
  }

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

/** Factory shorthand for MultiSpinner — matches `spinner()` style. */
export function multiSpinner() {
  return new MultiSpinner();
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
    this._unregister = null;
  }

  add(textOrOptions) {
    const opts = typeof textOrOptions === 'string' ? { text: textOrOptions } : textOrOptions;
    this._spinners.push({
      def:     (() => {
        const t = opts.type || 'braille';
        if (!SPINNERS[t]) {
          throw new RangeError(`MultiSpinner.add: unknown type "${t}" — expected one of ${Object.keys(SPINNERS).join(' | ')}`);
        }
        return SPINNERS[t];
      })(),
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
      write(ansi.clearLine());
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
    if (!isTTY()) {
      return this;
    }

    this._unregister = registerCleanup(() => this._cleanup());
    write(ansi.hide());
    for (let i = 0; i < this._spinners.length; i++) write('\n');
    this._lines = this._spinners.length;
    this._timer = setInterval(() => this._renderAll(), 80);
    if (this._timer.unref) this._timer.unref();
    this._renderAll();
    return this;
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._unregister) { this._unregister(); this._unregister = null; }

    if (isTTY()) {
      this._renderAll();
      write(ansi.show());
    } else {
      for (const s of this._spinners) {
        const sym = s.symbol ? s.symbol.replace(/\x1b\[[0-9;]*m/g, '') : (s.status === 'spinning' ? '·' : '✔');
        writeln(`  ${sym} ${s.text}`);
      }
    }
  }

  _cleanup() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (isTTY() && this._lines > 0) {
      // clear lines by rendering them empty
      write(ansi.up(this._lines));
      for (let i = 0; i < this._lines; i++) write(ansi.clearLine() + '\n');
    }
  }
}
