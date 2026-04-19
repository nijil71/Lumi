// ─── lumi-cli / progress ─────────────────────────────────────────────────

import { write, writeln, ansi, c as colors, cols, visibleLen, isTTY, getColorTheme, registerCleanup } from '../ansi.js';

/**
 * Middle-ellipsis truncation — keeps both ends of a label visible.
 *   `node_modules/foo/bar/baz.tar.gz` → `node_modul…tar.gz`
 * Assumes a plain string (no embedded ANSI); progress labels are almost
 * always plain paths or step names, which is where this is most useful.
 */
function truncateMiddle(str, width) {
  const s = String(str);
  if (visibleLen(s) <= width) return s;
  if (width <= 1) return '…';
  const keep  = width - 1;
  const left  = Math.ceil(keep / 2);
  const right = keep - left;
  return s.slice(0, left) + '…' + (right > 0 ? s.slice(s.length - right) : '');
}

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

// ─── ProgressBar class ────────────────────────────────────────────────────

export class ProgressBar {
  constructor(options = {}) {
    // total=0 means indeterminate; keep the user value so we can distinguish.
    this._indeterminate = options.total === 0;
    this._total   = this._indeterminate ? 1 : Math.max(1, options.total ?? 100);
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
    this._unregister = null;
    this._indetFrame = 0;

    // Non-TTY: track which percentage milestones we've printed
    this._printedMilestones = new Set();
  }

  _displayLabel() {
    // Cap labels at 24 visible columns and middle-ellipsis longer ones so a
    // path like `node_modules/foo/bar/baz.tar.gz` collapses to
    // `node_modul…tar.gz` instead of eating half the terminal.
    return this._label ? truncateMiddle(this._label, 24) : '';
  }

  _barWidth() {
    const terminal = this._width || cols();
    const labelLen = this._label ? visibleLen(this._displayLabel()) + 1 : 0;
    const pctLen   = 7;
    const numLen   = String(this._total).length * 2 + 3;
    const caps     = visibleLen(this._style.caps[0]) + visibleLen(this._style.caps[1]);
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
    const width  = this._barWidth();
    const s      = this._style;

    let bar;
    if (this._indeterminate) {
      // Sliding 20%-wide window that bounces across the track
      const chunk = Math.max(3, Math.floor(width * 0.2));
      const span = Math.max(1, width - chunk);
      const pos = Math.abs(((this._indetFrame++) % (span * 2)) - span);
      bar = s.empty.repeat(pos) + s.filled.repeat(chunk) + s.empty.repeat(Math.max(0, width - pos - chunk));
    } else {
      const pct    = Math.min(1, Math.max(0, this._current / this._total));
      const filled = Math.round(pct * width);
      const empty  = width - filled;
      bar = '';
      if (filled > 0) {
        bar += s.filled.repeat(Math.max(0, filled - 1));
        bar += s.head;
      }
      bar += s.empty.repeat(Math.max(0, empty));
    }

    const pct = this._indeterminate ? 0 : Math.min(1, Math.max(0, this._current / this._total));
    const coloredBar = this._colorFn(s.caps[0] + bar + s.caps[1]);
    const pctStr     = this._indeterminate
      ? `${colors.fog}  · %${colors.r}`
      : `${colors.fog}${String(Math.round(pct * 100)).padStart(3)}%${colors.r}`;
    const numStr     = this._indeterminate
      ? `${colors.slate}${this._current}${colors.r}`
      : `${colors.slate}${String(this._current).padStart(String(this._total).length)}/${this._total}${colors.r}`;
    const label      = this._label ? `${colors.mist}${this._displayLabel()}${colors.r} ` : '';

    let suffix = '';
    if (this._showEta && !this._indeterminate && pct < 1) {
      const eta = this._calcEta();
      if (eta) suffix += ` ${colors.slate}ETA ${eta}${colors.r}`;
    }
    if (this._showRate) {
      const rate = this._calcRate();
      if (rate) suffix += ` ${colors.slate}${rate}${colors.r}`;
    }

    write(ansi.clearLine());
    write(`${label}${coloredBar} ${pctStr} ${numStr}${suffix}`);
  }

  _renderNonTTY() {
    if (this._indeterminate) return;
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

    this._unregister = registerCleanup(() => this._cleanup());
    write(ansi.hide());
    write('\n');
    this._render();
    return this;
  }

  update(current, label) {
    if (label !== undefined) this._label = label;
    if (this._indeterminate) {
      this._current = current ?? this._current;
    } else {
      this._current = Math.min(Math.max(0, current), this._total);
    }

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
    this._indeterminate = false;
    this._current = this._total;

    if (!isTTY()) {
      if (!this._printedMilestones.has(100)) {
        const label = this._label ? `${this._label} ` : '';
        writeln(`${label}100% (${this._total}/${this._total})`);
      }
      if (text) writeln(`✔ ${text}`);
      if (this._unregister) { this._unregister(); this._unregister = null; }
      return;
    }

    this._render();
    write('\n');
    if (text) {
      write(`${colors.sage}✔${colors.r} ${colors.chalk}${text}${colors.r}\n`);
    }
    if (this._unregister) { this._unregister(); this._unregister = null; }
    write(ansi.show());
  }

  /** Remove the progress bar line from the terminal */
  clear() {
    if (isTTY()) {
      write(ansi.clearLine());
      write(ansi.show());
    }
    if (this._unregister) { this._unregister(); this._unregister = null; }
  }

  stop() {
    if (isTTY()) {
      write('\n');
      write(ansi.show());
    }
    if (this._unregister) { this._unregister(); this._unregister = null; }
  }

  _cleanup() {
    if (isTTY()) write(ansi.clearLine());
  }
}

// ─── Multi-bar ────────────────────────────────────────────────────────────

export class MultiBar {
  constructor() {
    this._bars  = [];
    this._lines = 0;
    this._unregister = null;
    this._autoTimer = null;
  }

  add(options) {
    const bar = new ProgressBar(options);
    // Start the timer so ETA/rate work for child bars even though we never
    // call bar.start() directly.
    bar._startMs = Date.now();
    this._bars.push(bar);
    return this._bars.length - 1;
  }

  update(idx, current, label) {
    const bar = this._bars[idx];
    if (!bar) return;
    if (bar._indeterminate) {
      bar._current = current ?? bar._current;
    } else {
      bar._current = Math.min(Math.max(0, current), bar._total);
    }
    if (label !== undefined) bar._label = label;
    // Re-render immediately so callers don't have to remember tick().
    if (isTTY() && this._lines > 0) this._renderAll();
  }

  increment(idx, by = 1, label) {
    const bar = this._bars[idx];
    if (!bar) return;
    return this.update(idx, bar._current + by, label);
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

    this._unregister = registerCleanup(() => this._cleanup());
    write(ansi.hide());
    for (let i = 0; i < this._bars.length; i++) write('\n');
    this._lines = this._bars.length;
    // Drive indeterminate bars on a timer so they animate without update() calls
    this._autoTimer = setInterval(() => {
      if (this._bars.some(b => b._indeterminate)) this._renderAll();
    }, 100);
    if (this._autoTimer.unref) this._autoTimer.unref();
    this._renderAll();
    return this;
  }

  tick() {
    if (!isTTY()) return this;
    this._renderAll();
    return this;
  }

  stop() {
    if (this._autoTimer) { clearInterval(this._autoTimer); this._autoTimer = null; }
    if (isTTY()) {
      this._renderAll();
      write(ansi.show());
    }
    if (this._unregister) { this._unregister(); this._unregister = null; }
  }

  _cleanup() {
    if (this._autoTimer) { clearInterval(this._autoTimer); this._autoTimer = null; }
  }
}

// ─── Convenience factory ──────────────────────────────────────────────────

export function progressBar(options) {
  return new ProgressBar(options);
}
