// ─── lumina-cli / spinners ────────────────────────────────────────────────

import { write, ansi, c as colors } from '../ansi.js';

export const SPINNERS = {
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
};

function makeThemes() {
  return {
    default:  (f) => `${colors.chalk}${f}${colors.r}`,
    chalk:    (f) => `${colors.chalk}${f}${colors.r}`,
    signal:   (f) => `${colors.signal}${colors.b}${f}${colors.r}`,
    sage:     (f) => `${colors.sage}${f}${colors.r}`,
    azure:    (f) => `${colors.azure}${f}${colors.r}`,
    amber:    (f) => `${colors.amber}${f}${colors.r}`,
    lavender: (f) => `${colors.lavender}${f}${colors.r}`,
    dim:      (f) => `${colors.slate}${f}${colors.r}`,
  };
}

function getTheme(name) {
  const t = makeThemes();
  return t[name] || t.default;
}

export class Spinner {
  constructor(options = {}) {
    this._def     = SPINNERS[options.type || 'braille'] || SPINNERS.braille;
    this._text    = options.text   || '';
    this._colorFn = getTheme(options.color || 'default');
    this._frame   = 0;
    this._timer   = null;
    this._prefix  = options.prefix || '';
  }

  _render() {
    const frame   = this._def.frames[this._frame % this._def.frames.length];
    const spinner = this._colorFn(frame);
    const prefix  = this._prefix ? `${colors.slate}${colors.b}${this._prefix}${colors.r} ` : '';
    const text    = this._text   ? ` ${colors.fog}${this._text}${colors.r}` : '';
    write(ansi.col(1) + ansi.clearLine() + `${prefix}${spinner}${text}`);
    this._frame++;
  }

  start(text) {
    if (text !== undefined) this._text = text;
    write(ansi.hide());
    this._timer = setInterval(() => this._render(), this._def.interval);
    this._render();
    return this;
  }

  setText(t)     { this._text = t; return this; }
  setColor(name) { this._colorFn = getTheme(name); return this; }

  succeed(text) { this._stop(`${colors.sage}✔${colors.r}`,   text || this._text); }
  fail(text)    { this._stop(`${colors.signal}✘${colors.r}`, text || this._text); }
  warn(text)    { this._stop(`${colors.amber}⚠${colors.r}`,  text || this._text); }
  info(text)    { this._stop(`${colors.azure}ℹ${colors.r}`,  text || this._text); }

  _stop(symbol, text) {
    clearInterval(this._timer);
    write(ansi.col(1) + ansi.clearLine());
    write(`${symbol} ${colors.chalk}${text}${colors.r}\n`);
    write(ansi.show());
  }

  stop() {
    clearInterval(this._timer);
    write(ansi.col(1) + ansi.clearLine());
    write(ansi.show());
  }
}

export function spinner(textOrOptions) {
  if (typeof textOrOptions === 'string') return new Spinner({ text: textOrOptions });
  return new Spinner(textOrOptions);
}

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
      colorFn: getTheme(opts.color || 'default'),
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
    write(ansi.hide());
    for (let i = 0; i < this._spinners.length; i++) write('\n');
    this._lines = this._spinners.length;
    this._timer = setInterval(() => this._renderAll(), 80);
    this._renderAll();
    return this;
  }

  stop() {
    clearInterval(this._timer);
    this._renderAll();
    write(ansi.show());
  }
}
