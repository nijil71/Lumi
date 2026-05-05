// ─── lumi-cli / logger ──────────────────────────────────────────────────

import { writeln, write, visibleLen, c as colors } from '../ansi.js';

const LEVELS = {
  info:    { symbol: 'ℹ', icon: '◆', color: colors.azure,    label: 'info ', frame: '│' },
  success: { symbol: '✔', icon: '◉', color: colors.sage,     label: 'ok   ', frame: '│' },
  warn:    { symbol: '⚠', icon: '◈', color: colors.amber,    label: 'warn ', frame: '│' },
  error:   { symbol: '✘', icon: '✦', color: colors.signal,   label: 'error', frame: '│' },
  debug:   { symbol: '◆', icon: '▶', color: colors.lavender, label: 'debug', frame: '│' },
  log:     { symbol: '·', icon: '▪', color: colors.slate,    label: 'log  ', frame: '│' },
};

function timestamp() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

class Logger {
  constructor(options = {}) {
    this._timestamps = options.timestamps ?? false;
    this._prefix     = options.prefix     ?? '';
  }

  _log(level, ...args) {
    const l = LEVELS[level] || LEVELS.log;
    const ts = this._timestamps ? `${colors.slate}${timestamp()}${colors.r} ` : '';
    const pre = this._prefix ? `${colors.graphite}[${this._prefix}]${colors.r} ` : '';
    const sym = `${l.color}${l.symbol}${colors.r}`;
    const msg = args.join(' ');
    writeln(`${ts}${pre}${sym} ${msg}`);
  }

  info(...args)    { this._log('info',    ...args); return this; }
  success(...args) { this._log('success', ...args); return this; }
  warn(...args)    { this._log('warn',    ...args); return this; }
  error(...args)   { this._log('error',   ...args); return this; }
  debug(...args)   { this._log('debug',   ...args); return this; }
  log(...args)     { this._log('log',     ...args); return this; }

  // Step list — numbered sequence with modern visual design
  step(n, total, text) {
    const fraction = `${colors.slate}${n}/${total}${colors.r}`;
    const progress = `${colors.azure}${'▪'.repeat(n)}${'░'.repeat(Math.max(0, total - n))}${colors.r}`;
    const marker = `${colors.lavender}▸${colors.r}`;
    writeln(`  ${marker} ${progress} ${fraction}  ${colors.chalk}${text}${colors.r}`);
    return this;
  }

  // Key-value pair with improved visual hierarchy and grouping
  // Uses dot leaders for alignment and semantic coloring
  kv(key, value, options = {}) {
    const kw  = options.keyWidth || 20;
    const kvLen = visibleLen(key);
    const gap = Math.max(1, kw - kvLen);
    // Enhanced dot leader with better visual balance
    const filler = gap >= 6
      ? ' ' + `${colors.d}${'· '.repeat(Math.floor((gap - 2) / 2))}${colors.r}` +
        ' '.repeat((gap - 2) - Math.floor((gap - 2) / 2) * 2) + ' '
      : ' '.repeat(gap);
    // Improved styling with visual markers and better contrast
    const bracket = `${colors.d}${colors.slate}│${colors.r}`;
    writeln(`  ${bracket} ${colors.slate}${key}${colors.r}${filler}${colors.chalk}${value}${colors.r}`);
    return this;
  }

  // Blank line
  br() { writeln(); return this; }

  // Raw
  raw(text) { write(text); return this; }
}

export const log = new Logger();

export function createLogger(options) {
  return new Logger(options);
}
