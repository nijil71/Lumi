// ─── lumi-cli / statusbar ─────────────────────────────────────────────────

import { write, ansi, c as colors, cols, rows, stripAnsi, isTTY } from '../ansi.js';

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
    this._left   = options.left   ?? '';
    this._center = options.center ?? '';
    this._right  = options.right  ?? '';
    this._bg     = colors.bgGraphite;
    this._fg     = colors.chalk;
  }

  /**
   * Update one or more sections and re-render immediately.
   * @param {{ left?: string, center?: string, right?: string }} parts
   */
  update(parts = {}) {
    if (parts.left   !== undefined) this._left   = parts.left;
    if (parts.center !== undefined) this._center = parts.center;
    if (parts.right  !== undefined) this._right  = parts.right;
    return this.render();
  }

  /** Paint the status line at the bottom of the terminal. */
  render() {
    if (!isTTY()) return this;

    const w          = cols();
    const row        = rows();
    const leftVis    = stripAnsi(this._left);
    const centerVis  = stripAnsi(this._center);
    const rightVis   = stripAnsi(this._right);

    let line;
    if (this._center) {
      const sideSpace = Math.floor((w - centerVis.length) / 2);
      const leftPad   = Math.max(0, sideSpace - leftVis.length);
      const rightPad  = Math.max(0, w - leftVis.length - leftPad - centerVis.length - rightVis.length);
      line = this._left + ' '.repeat(leftPad) + this._center + ' '.repeat(rightPad) + this._right;
    } else {
      const gap = Math.max(0, w - leftVis.length - rightVis.length);
      line = this._left + ' '.repeat(gap) + this._right;
    }

    write(
      ansi.save() +
      ansi.pos(row, 1) +
      ansi.clearLine() +
      this._bg + this._fg +
      line.slice(0, w) +
      colors.r +
      ansi.restore()
    );
    return this;
  }

  /** Remove the status line and restore the bottom row. */
  clear() {
    if (!isTTY()) return this;
    write(
      ansi.save() +
      ansi.pos(rows(), 1) +
      ansi.clearLine() +
      ansi.restore()
    );
    return this;
  }
}

/** Factory shorthand. */
export function statusBar(options) {
  return new StatusBar(options);
}
