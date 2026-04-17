// ─── lumi-cli / tree ──────────────────────────────────────────────────────

import { writeln, c as colors, getColorTheme } from '../ansi.js';

// Box-drawing connector chars
const PIPE  = '│   ';
const TEE   = '├── ';
const ELBOW = '└── ';
const BLANK = '    ';

/**
 * Render a nested structure as a tree with box-drawing connectors.
 *
 * @param {Record<string,any>|string[]} data
 *   - Object: keys are node labels, values are children (object/array) or null (leaf)
 *   - Array:  items are leaf node labels
 * @param {object}  options
 * @param {string}  [options.color='chalk']     - Theme name for leaf nodes
 * @param {string}  [options.dirColor='azure']  - Theme name for branch (non-leaf) nodes
 * @param {string}  [options.lineColor='dim']   - Theme name for connector lines
 *
 * @example
 * tree({
 *   'src/': {
 *     'index.js': null,
 *     'utils/': { 'math.js': null, 'string.js': null },
 *   },
 *   'package.json': null,
 * });
 */
export function tree(data, options = {}) {
  // Resolve via getColorTheme so theme names (like 'dim') work consistently
  // with the rest of the library. Previously this used `colors[name]` which
  // silently fell back to chalk for any theme whose name didn't match a
  // palette key (e.g. 'dim' → `colors.d`, mismatch → chalk).
  const leafTheme = getColorTheme(options.color     || 'chalk');
  const dirTheme  = getColorTheme(options.dirColor  || 'azure');
  const lineTheme = getColorTheme(options.lineColor || 'dim');

  function renderNode(key, value, prefix, isLast) {
    const connector  = isLast ? ELBOW : TEE;
    const childPfx   = prefix + (isLast ? BLANK : PIPE);
    const isDir      = value !== null && value !== undefined &&
                       (typeof value === 'object');
    const labelTheme = isDir ? dirTheme : leafTheme;

    writeln(lineTheme(prefix + connector) + labelTheme(String(key)));

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        renderNode(String(value[i]), null, childPfx, i === value.length - 1);
      }
    } else if (isDir) {
      const entries = Object.entries(value);
      for (let i = 0; i < entries.length; i++) {
        renderNode(entries[i][0], entries[i][1], childPfx, i === entries.length - 1);
      }
    }
  }

  const entries = Array.isArray(data)
    ? data.map(v => [String(v), null])
    : Object.entries(data);

  for (let i = 0; i < entries.length; i++) {
    renderNode(entries[i][0], entries[i][1], '', i === entries.length - 1);
  }
}
