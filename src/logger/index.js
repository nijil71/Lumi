// ─── lumina-cli / logger ──────────────────────────────────────────────────

import { writeln, write, c as colors } from '../ansi.js';

const LEVELS = {
  info:    { symbol: 'ℹ', color: colors.azure,    label: 'info ' },
  success: { symbol: '✔', color: colors.sage,     label: 'ok   ' },
  warn:    { symbol: '⚠', color: colors.amber,    label: 'warn ' },
  error:   { symbol: '✘', color: colors.signal,   label: 'error' },
  debug:   { symbol: '◆', color: colors.lavender, label: 'debug' },
  log:     { symbol: '·', color: colors.slate,    label: 'log  ' },
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

  // Step list — numbered sequence
  step(n, total, text) {
    const fraction = `${colors.slate}${n}/${total}${colors.r}`;
    const bar = `${colors.graphite}${'─'.repeat(3)}${colors.r}`;
    writeln(`  ${bar} ${fraction} ${colors.chalk}${text}${colors.r}`);
    return this;
  }

  // Key-value pair
  kv(key, value, options = {}) {
    const kw     = options.keyWidth || 20;
    const padded = key.padEnd(kw, ' ');
    writeln(`  ${colors.slate}${padded}${colors.r}${colors.chalk}${value}${colors.r}`);
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
