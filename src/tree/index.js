// ─── lumi-cli / tree ──────────────────────────────────────────────────────

import { writeln, c as colors } from '../ansi.js';

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
 * @param {string}  [options.color='chalk']     - Label color for leaf nodes
 * @param {string}  [options.dirColor='azure']  - Color for branch (non-leaf) nodes
 * @param {string}  [options.lineColor='dim']   - Color for connector lines
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
  const leafColor = colors[options.color]     ?? colors.chalk;
  const dirColor  = colors[options.dirColor]  ?? colors.azure;
  const lineColor = colors[options.lineColor] ?? colors.graphite;

  function renderNode(key, value, prefix, isLast) {
    const connector  = isLast ? ELBOW : TEE;
    const childPfx   = prefix + (isLast ? BLANK : PIPE);
    const isDir      = value !== null && value !== undefined &&
                       (typeof value === 'object');
    const labelColor = isDir ? dirColor : leafColor;

    writeln(
      `${lineColor}${prefix}${connector}${colors.r}${labelColor}${key}${colors.r}`
    );

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
