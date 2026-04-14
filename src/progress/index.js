// ─── lumina-cli / progress ─────────────────────────────────────────────────

import { write, ansi, c as colors, cols, padEnd, stripAnsi } from '../ansi.js';

// ─── Progress bar styles ──────────────────────────────────────────────────

const STYLES = {
  // Solid block — classic but refined
  block: {
    filled: '█',
    empty:  '░',
    head:   '█',
    caps:   ['', ''],
  },
  // Shaded — softer graduation
  shaded: {
    filled: '▓',
    empty:  '░',
    head:   '▓',
    caps:   ['', ''],
  },
  // Bracket — Swiss precision
  bracket: {
    filled: '─',
    empty:  ' ',
    head:   '▶',
    caps:   ['[', ']'],
  },
  // Thin — minimal, elegant
  thin: {
    filled: '▬',
    empty:  '╌',
    head:   '▶',
    caps:   ['', ''],
  },
  // Brutalist — raw bars
  brutalist: {
    filled: '■',
    empty:  '□',
    head:   '■',
    caps:   ['▐', '▌'],
  },
  // Dots — playful grid
  dots: {
    filled: '●',
    empty:  '○',
    head:   '●',
    caps:   ['', ''],
  },
};

// ─── ProgressBar class ────────────────────────────────────────────────────

export class ProgressBar {
  constructor(options = {}) {
    this._total   = Math.max(1, options.total ?? 100);
    this._current = Math.max(0, options.current ?? 0);
    this._style   = STYLES[options.style || 'block'];
    this._width   = options.width   || null;  // null = auto from terminal
    this._label   = options.label   || '';
    this._color   = options.color   || 'azure';
    this._stream  = process.stdout;
    this._started = false;

    this._colorFn = {
      azure:    (s) => `${colors.azure}${s}${colors.r}`,
      signal:   (s) => `${colors.signal}${s}${colors.r}`,
      sage:     (s) => `${colors.sage}${s}${colors.r}`,
      amber:    (s) => `${colors.amber}${s}${colors.r}`,
      lavender: (s) => `${colors.lavender}${s}${colors.r}`,
      chalk:    (s) => `${colors.chalk}${s}${colors.r}`,
    }[this._color] || ((s) => s);
  }

  _barWidth() {
    const terminal = this._width || cols();
    const labelLen = this._label ? stripAnsi(this._label).length + 1 : 0;
    const pctLen   = 7; // ' 100% '
    const numLen   = String(this._total).length * 2 + 3; // 'nnn/NNN '
    const caps     = this._style.caps[0].length + this._style.caps[1].length;
    return Math.max(1, terminal - labelLen - pctLen - numLen - caps - 2);
  }

  _render() {
    const pct    = Math.min(1, Math.max(0, this._current / this._total));
    const width  = this._barWidth();
    const filled = Math.round(pct * width);
    const empty  = width - filled;
    const s      = this._style;

    let bar = '';
    if (filled > 0) {
      bar += s.filled.repeat(Math.max(0, filled - 1));
      bar += filled > 0 ? s.head : '';
    }
    bar += s.empty.repeat(Math.max(0, empty));

    const coloredBar = this._colorFn(s.caps[0] + bar + s.caps[1]);
    const pctStr     = `${colors.fog}${String(Math.round(pct * 100)).padStart(3)}%${colors.r}`;
    const numStr     = `${colors.slate}${String(this._current).padStart(String(this._total).length)}/${this._total}${colors.r}`;
    const label      = this._label ? `${colors.mist}${this._label}${colors.r} ` : '';

    write(ansi.col(1) + ansi.clearLine());
    write(`${label}${coloredBar} ${pctStr} ${numStr}`);
  }

  start() {
    write(ansi.hide());
    this._started = true;
    write('\n');
    this._render();
    return this;
  }

  update(current, label) {
    if (label !== undefined) this._label = label;
    this._current = Math.min(Math.max(0, current), this._total);
    this._render();
    return this;
  }

  increment(by = 1, label) {
    return this.update(this._current + by, label);
  }

  complete(text) {
    this._current = this._total;
    this._render();
    write('\n');
    if (text) {
      write(`${colors.sage}✔${colors.r} ${colors.chalk}${text}${colors.r}\n`);
    }
    write(ansi.show());
  }

  stop() {
    write('\n');
    write(ansi.show());
  }
}

// ─── Multi-bar — render multiple progress bars simultaneously ─────────────

export class MultiBar {
  constructor() {
    this._bars  = [];
    this._lines = 0;
  }

  add(options) {
    const bar = new ProgressBar(options);
    this._bars.push(bar);
    return this._bars.length - 1;
  }

  update(idx, current, label) {
    const bar = this._bars[idx];
    if (!bar) return;
    bar._current = Math.min(current, bar._total);
    if (label !== undefined) bar._label = label;
  }

  _renderAll() {
    if (this._lines > 0) write(ansi.up(this._lines));
    for (const bar of this._bars) {
      bar._render();
      write('\n');
    }
    this._lines = this._bars.length;
  }

  start() {
    write(ansi.hide());
    for (let i = 0; i < this._bars.length; i++) write('\n');
    this._lines = this._bars.length;
    this._renderAll();
    return this;
  }

  tick() {
    this._renderAll();
    return this;
  }

  stop() {
    this._renderAll();
    write(ansi.show());
  }
}

// ─── Convenience factory ──────────────────────────────────────────────────

export function progressBar(options) {
  return new ProgressBar(options);
}
