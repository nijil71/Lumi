// ─── lumi-cli / progress ─────────────────────────────────────────────────

import { write, writeln, ansi, c as colors, cols, stripAnsi, isTTY, getColorTheme } from '../ansi.js';

// ─── Progress bar styles ──────────────────────────────────────────────────

const STYLES = {
  block: {
    filled: '█', empty: '░', head: '█', caps: ['', ''],
  },
  shaded: {
    filled: '▓', empty: '░', head: '▓', caps: ['', ''],
  },
  bracket: {
    filled: '─', empty: ' ', head: '▶', caps: ['[', ']'],
  },
  thin: {
    filled: '▬', empty: '╌', head: '▶', caps: ['', ''],
  },
  brutalist: {
    filled: '■', empty: '□', head: '■', caps: ['▐', '▌'],
  },
  dots: {
    filled: '●', empty: '○', head: '●', caps: ['', ''],
  },
};

// ─── SIGINT cleanup registry ──────────────────────────────────────────────

const activeInstances = new Set();
let sigintBound = false;

function ensureSigintHandler() {
  if (sigintBound) return;
  sigintBound = true;
  process.on('SIGINT', () => {
    for (const instance of activeInstances) {
      if (typeof instance.stop === 'function') instance.stop();
    }
    write(ansi.show());
    process.exit(130);
  });
}

// ─── ProgressBar class ────────────────────────────────────────────────────

export class ProgressBar {
  constructor(options = {}) {
    this._total   = Math.max(1, options.total ?? 100);
    this._current = Math.max(0, options.current ?? 0);
    this._style   = STYLES[options.style || 'block'];
    this._width   = options.width   || null;
    this._label   = options.label   || '';
    this._color   = options.color   || 'azure';
    this._showEta = options.eta     || false;
    this._showRate = options.rate   || false;
    this._stream  = process.stdout;
    this._started = false;
    this._startMs = null;
    this._colorFn = getColorTheme(this._color);

    // Non-TTY: track which percentage milestones we've printed
    this._printedMilestones = new Set();
  }

  _barWidth() {
    const terminal = this._width || cols();
    const labelLen = this._label ? stripAnsi(this._label).length + 1 : 0;
    const pctLen   = 7;
    const numLen   = String(this._total).length * 2 + 3;
    const caps     = this._style.caps[0].length + this._style.caps[1].length;
    const etaLen   = this._showEta ? 10 : 0;
    const rateLen  = this._showRate ? 12 : 0;
    return Math.max(1, terminal - labelLen - pctLen - numLen - caps - etaLen - rateLen - 2);
  }

  _calcEta() {
    if (!this._startMs || this._current === 0) return '';
    const elapsed = Date.now() - this._startMs;
    const rate = this._current / elapsed;
    const remaining = (this._total - this._current) / rate;
    if (remaining < 1000) return '<1s';
    if (remaining < 60000) return `${Math.ceil(remaining / 1000)}s`;
    return `${Math.floor(remaining / 60000)}m${Math.ceil((remaining % 60000) / 1000)}s`;
  }

  _calcRate() {
    if (!this._startMs || this._current === 0) return '';
    const elapsed = (Date.now() - this._startMs) / 1000;
    if (elapsed === 0) return '';
    const rate = this._current / elapsed;
    if (rate >= 1000) return `${(rate / 1000).toFixed(1)}K/s`;
    if (rate >= 1) return `${rate.toFixed(1)}/s`;
    return `${(rate * 1000).toFixed(0)}ms/op`;
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

    let suffix = '';
    if (this._showEta && pct < 1) {
      const eta = this._calcEta();
      if (eta) suffix += ` ${colors.slate}ETA ${eta}${colors.r}`;
    }
    if (this._showRate) {
      const rate = this._calcRate();
      if (rate) suffix += ` ${colors.slate}${rate}${colors.r}`;
    }

    write(ansi.col(1) + ansi.clearLine());
    write(`${label}${coloredBar} ${pctStr} ${numStr}${suffix}`);
  }

  _renderNonTTY() {
    const pct = Math.round((this._current / this._total) * 100);
    const milestones = [0, 25, 50, 75, 100];
    for (const m of milestones) {
      if (pct >= m && !this._printedMilestones.has(m)) {
        this._printedMilestones.add(m);
        const label = this._label ? `${this._label} ` : '';
        writeln(`${label}${m}% (${this._current}/${this._total})`);
      }
    }
  }

  start() {
    this._startMs = Date.now();
    this._started = true;

    if (!isTTY()) {
      this._renderNonTTY();
      return this;
    }

    ensureSigintHandler();
    activeInstances.add(this);
    write(ansi.hide());
    write('\n');
    this._render();
    return this;
  }

  update(current, label) {
    if (label !== undefined) this._label = label;
    this._current = Math.min(Math.max(0, current), this._total);

    if (!isTTY()) {
      this._renderNonTTY();
      return this;
    }
    this._render();
    return this;
  }

  increment(by = 1, label) {
    return this.update(this._current + by, label);
  }

  complete(text) {
    this._current = this._total;

    if (!isTTY()) {
      if (!this._printedMilestones.has(100)) {
        const label = this._label ? `${this._label} ` : '';
        writeln(`${label}100% (${this._total}/${this._total})`);
      }
      if (text) writeln(`✔ ${text}`);
      return;
    }

    this._render();
    write('\n');
    if (text) {
      write(`${colors.sage}✔${colors.r} ${colors.chalk}${text}${colors.r}\n`);
    }
    activeInstances.delete(this);
    write(ansi.show());
  }

  /** Remove the progress bar line from the terminal */
  clear() {
    if (isTTY()) {
      write(ansi.col(1) + ansi.clearLine());
    }
    activeInstances.delete(this);
    write(ansi.show());
  }

  stop() {
    write('\n');
    activeInstances.delete(this);
    write(ansi.show());
  }
}

// ─── Multi-bar ────────────────────────────────────────────────────────────

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
    if (!isTTY()) return this;

    ensureSigintHandler();
    activeInstances.add(this);
    write(ansi.hide());
    for (let i = 0; i < this._bars.length; i++) write('\n');
    this._lines = this._bars.length;
    this._renderAll();
    return this;
  }

  tick() {
    if (!isTTY()) return this;
    this._renderAll();
    return this;
  }

  stop() {
    if (isTTY()) {
      this._renderAll();
    }
    activeInstances.delete(this);
    write(ansi.show());
  }
}

// ─── Convenience factory ──────────────────────────────────────────────────

export function progressBar(options) {
  return new ProgressBar(options);
}
