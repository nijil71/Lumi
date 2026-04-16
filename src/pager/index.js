// ─── lumi-cli / pager ───────────────────────────────────────────────────────
// Zero-dependency terminal built-in paginator (like 'less').
// Uses alternate screen buffer to prevent clogging scrollback.

import { write, writeln, ansi, cols, rows, c as colors, isTTY, truncate, padEnd } from '../ansi.js';

const ESC = '\x1b[';
const CTRL_C = '\x03';
const UP     = '\x1b[A';
const DOWN   = '\x1b[B';
const PAGE_UP = '\x1b[5~';
const PAGE_DOWN = '\x1b[6~';
const Q_KEY = 'q';
const J_KEY = 'j';
const K_KEY = 'k';

export async function pager(text, options = {}) {
  if (!isTTY()) {
    writeln(Array.isArray(text) ? text.join('\n') : text);
    return;
  }

  const lines = Array.isArray(text) ? text : text.split('\n');
  const termHeight = rows();
  const termWidth = cols();
  const PAGE_SIZE = termHeight - 1; // leave 1 line for status bar
  
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
                       `Press q to quit, arrows to scroll`;
    
    out += ansi.bgCarbon + colors.white + truncate(padEnd(statusText, termWidth), termWidth) + ansi.reset;
    write(out);
  }

  const altScreenEnter = `${ESC}?1049h`;
  const altScreenExit  = `${ESC}?1049l`;

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
      if (key === CTRL_C || key === Q_KEY || key === 'Q') {
        process.stdin.removeListener('data', listener);
        closeRaw();
        write(altScreenExit + ansi.show());
        resolve();
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
      }
      
      if (needsRender) render();
    }

    process.stdin.on('data', listener);
  });
}
