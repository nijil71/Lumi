// ─── lumi-cli / sparkline ─────────────────────────────────────────────────

import { c as colors, getColorTheme } from '../ansi.js';

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * Render an array of numbers as a compact inline sparkline.
 * Perfect inside log lines, kv pairs, and status displays.
 *
 * @param {number[]} values - Data points to visualize
 * @param {object}   options
 * @param {string}   [options.color='azure']  - Palette color name
 * @param {number}   [options.min]            - Override floor value
 * @param {number}   [options.max]            - Override ceiling value
 * @returns {string} Colored sparkline string (inline, no newline)
 *
 * @example
 * log.kv('CPU', sparkline([12, 45, 78, 34, 90]));
 * // CPU  ▁▄▇▃█
 */
export function sparkline(values, options = {}) {
  if (!values || values.length === 0) return '';

  const min     = options.min !== undefined ? options.min : Math.min(...values);
  const max     = options.max !== undefined ? options.max : Math.max(...values);
  const range   = max - min || 1;
  const colorFn = getColorTheme(options.color || 'azure');

  const chars = values.map(v => {
    const clamped = Math.max(min, Math.min(max, v));
    const idx     = Math.round(((clamped - min) / range) * (BLOCKS.length - 1));
    return BLOCKS[idx];
  });

  return colorFn(chars.join(''));
}
