// ─── lumi-cli / statusbar ─────────────────────────────────────────────────

import { write, ansi, c as colors, cols, rows, visibleLen, truncate, isTTY, registerCleanup } from '../ansi.js';

/**
 * A persistent status line pinned to the bottom row of the terminal.
 * Uses cursor save/restore so it never interrupts normal scrolling output.
 *
 * Call `.render()` (or `.update()`) after any log output to keep it visible,
 * and `.clear()` when done to remove it.
 *
 * @example
 * const bar = new StatusBar({ left: '⣿ Building…', right: 'CPU 42%' });
 * bar.render();
 * // ... do work, call bar.update() periodically ...
 * bar.clear();
 */
export class StatusBar {
  constructor(options = {}) {
    this._left     = options.left   ?? '';
    this._center   = options.center ?? '';
    this._right    = options.right  ?? '';
    this._segments = options.segments ?? null;
    this._sep      = options.separator ?? `${colors.slate} │ ${colors.r}`;
    this._bg       = colors.bgGraphite;
    this._fg       = colors.chalk;
    this._unregister = null;
    this._rendered = false;
  }

  /**
   * Update one or more sections and re-render immediately.
   * @param {{ left?: string, center?: string, right?: string,
   *           segments?: StatusBarSegment[], separator?: string }} parts
   */
  update(parts = {}) {
    if (parts.left      !== undefined) this._left     = parts.left;
    if (parts.center    !== undefined) this._center   = parts.center;
    if (parts.right     !== undefined) this._right    = parts.right;
    if (parts.segments  !== undefined) this._segments = parts.segments;
    if (parts.separator !== undefined) this._sep      = parts.separator;
    return this.render();
  }

  /**
   * Compose segments into a styled string. Each segment:
   *   `{ icon?: string, text: string, color?: ColorName }`
   * Joined by `this._sep` (default dim ` │ `).
   */
  _composeSegments() {
    if (!this._segments || this._segments.length === 0) return '';
    const parts = this._segments.map((seg) => {
      const prefix = seg.icon ? `${seg.icon} ` : '';
      const paint  = seg.color ? (s) => `${colors[seg.color] ?? ''}${s}${colors.r}` : (s) => s;
      return paint(`${prefix}${seg.text}`);
    });
    return parts.join(this._sep);
  }

  /** Paint the status line at the bottom of the terminal. */
  render() {
    if (!isTTY()) return this;

    // Register a cleanup on first render so the bottom row is cleared
    // on exit / Ctrl+C even if caller forgets clear().
    if (!this._rendered) {
      this._rendered = true;
      this._unregister = registerCleanup(() => this._cleanup());
    }

    const w          = cols();
    const row        = rows();
    // Segments, when present, occupy the left slot and override any plain
    // `left:` string passed in. center/right still work independently.
    const effLeft    = this._segments ? this._composeSegments() : this._left;
    const leftVis    = visibleLen(effLeft);
    const centerVis  = visibleLen(this._center);
    const rightVis   = visibleLen(this._right);

    let line;
    if (this._center) {
      const sideSpace = Math.floor((w - centerVis) / 2);
      const leftPad   = Math.max(0, sideSpace - leftVis);
      const rightPad  = Math.max(0, w - leftVis - leftPad - centerVis - rightVis);
      line = effLeft + ' '.repeat(leftPad) + this._center + ' '.repeat(rightPad) + this._right;
    } else {
      const gap = Math.max(0, w - leftVis - rightVis);
      line = effLeft + ' '.repeat(gap) + this._right;
    }

    // Truncate to terminal width honouring ANSI + wide chars
    const shown = visibleLen(line) > w ? truncate(line, w) : line;

    write(
      ansi.save() +
      ansi.pos(row, 1) +
      ansi.clearLine() +
      this._bg + this._fg +
      shown +
      colors.r +
      ansi.restore()
    );
    return this;
  }

  /** Remove the status line and restore the bottom row. */
  clear() {
    if (!isTTY()) return this;
    this._cleanup();
    if (this._unregister) { this._unregister(); this._unregister = null; }
    this._rendered = false;
    return this;
  }

  _cleanup() {
    if (!isTTY()) return;
    write(
      ansi.save() +
      ansi.pos(rows(), 1) +
      ansi.clearLine() +
      ansi.restore()
    );
  }
}

/** Factory shorthand. */
export function statusBar(options) {
  return new StatusBar(options);
}
