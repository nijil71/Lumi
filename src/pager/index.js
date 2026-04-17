// ─── lumi-cli / pager ───────────────────────────────────────────────────────
// Zero-dependency terminal built-in paginator (like 'less').
// Uses alternate screen buffer to prevent clogging scrollback.

import { write, writeln, ansi, cols, rows, c as colors, isTTY, truncate, padEnd, visibleLen, registerCleanup } from '../ansi.js';

const ESC = '\x1b[';
const CTRL_C = '\x03';
const UP     = '\x1b[A';
const DOWN   = '\x1b[B';
const PAGE_UP = '\x1b[5~';
const PAGE_DOWN = '\x1b[6~';
const HOME = '\x1b[H';
const END = '\x1b[F';
const Q_KEY = 'q';
const G_KEY = 'g';
const J_KEY = 'j';
const K_KEY = 'k';

const altScreenEnter = `${ESC}?1049h`;
const altScreenExit  = `${ESC}?1049l`;

export async function pager(text, options = {}) {
  if (!isTTY()) {
    writeln(Array.isArray(text) ? text.join('\n') : text);
    return;
  }

  const lines = Array.isArray(text) ? text : text.split('\n');
  const termHeight = rows();
  const termWidth = cols();
  const PAGE_SIZE = Math.max(1, termHeight - 1); // leave 1 line for status bar

  if (lines.length <= PAGE_SIZE) {
    // If it fits on the screen, just print it directly to avoid taking over the terminal
    writeln(lines.join('\n'));
    return;
  }

  let offset = 0;

  // Render function
  function render() {
    let out = ansi.pos(1, 1);
    const visibleLines = lines.slice(offset, offset + PAGE_SIZE);

    for (let i = 0; i < PAGE_SIZE; i++) {
      if (i < visibleLines.length) {
         out += ansi.clearLine() + truncate(visibleLines[i], termWidth) + '\n';
      } else {
         out += ansi.clearLine() + '\n';
      }
    }

    // Status bar
    const progress = Math.round(((offset + PAGE_SIZE) / lines.length) * 100);
    const limitedProgress = Math.min(100, progress);
    const statusText = ` ${options.title || 'lumi pager'} ` +
                       `│ ` +
                       `Lines ${offset + 1}-${Math.min(offset + PAGE_SIZE, lines.length)} of ${lines.length} ` +
                       `│ ` +
                       `${limitedProgress}% ` +
                       `│ ` +
                       `Press q to quit, arrows/jk to scroll, g/G top/bottom`;

    // Truncate to terminal width, then pad the tail to fill the row.
    const shown = visibleLen(statusText) > termWidth
      ? truncate(statusText, termWidth)
      : padEnd(statusText, termWidth);

    out += colors.bgCarbon + colors.white + shown + ansi.reset;
    write(out);
  }

  // Install a cleanup so Ctrl+C / unexpected exit always leaves the alt
  // screen and restores the cursor.
  const cleanup = () => {
    write(altScreenExit + ansi.show());
  };
  const unregister = registerCleanup(cleanup);

  write(altScreenEnter + ansi.hide());
  render();

  function openRaw() {
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
  }

  function closeRaw() {
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    process.stdin.pause();
  }

  await new Promise((resolve) => {
    openRaw();

    function listener(key) {
      if (key === CTRL_C) {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        cleanup();
        process.exit(130);
      }
      if (key === Q_KEY || key === 'Q') {
        process.stdin.removeListener('data', listener);
        closeRaw();
        unregister();
        cleanup();
        resolve();
        return;
      }

      let needsRender = false;
      if (key === UP || key === K_KEY) {
        if (offset > 0) { offset--; needsRender = true; }
      } else if (key === DOWN || key === J_KEY) {
        if (offset < lines.length - PAGE_SIZE) { offset++; needsRender = true; }
      } else if (key === PAGE_UP) {
        offset = Math.max(0, offset - PAGE_SIZE);
        needsRender = true;
      } else if (key === PAGE_DOWN || key === ' ') {
        offset = Math.min(lines.length - PAGE_SIZE, offset + PAGE_SIZE);
        needsRender = true;
      } else if (key === G_KEY) {
        offset = 0;
        needsRender = true;
      } else if (key === 'G' || key === END) {
        offset = Math.max(0, lines.length - PAGE_SIZE);
        needsRender = true;
      } else if (key === HOME) {
        offset = 0;
        needsRender = true;
      }

      if (needsRender) render();
    }

    process.stdin.on('data', listener);
  });
}
