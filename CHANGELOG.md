# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.9] — 2026-04-17

### Added
- **Performance Benchmarks**: Documented ceilings for spinners (3m+ renders/s), diff engine (10k lines in 60ms), and tables (10k rows in 120ms).
- **Snapshot Testing**: Native snapshot harness in `test/snapshot.js` for visual regression testing.
- **Examples**: Standalone copy-pasteable scripts for `spinners`, `progress`, and `prompts`.
- **Build System**: Introduced `esbuild` bundling to distribute a single tree-shakeable `dist/index.js`.
- **Linear Myers' Diff**: Rewrote Diff engine logic to use $O(N+M)$ space complexity (linear).

### Fixed
- **ANSI & Rendering**: Corrected `ansi.clearLine()` to always move cursor to column 1 via `\r`.
- **Truncation Logic**: Improved `truncate()` to track SGR state, ensuring ellipsis inherits styles and resets correctly.
- **Gradients**: Reversed the `matrix` gradient color flow for a more natural "rain" effect.
- **Color Detection**: Conservative `colorLevel()` detection that defaults to Level 2 (256-color) for generic `xterm` environments to prevent broken Truecolor output.
- **Fallbacks**: Implemented 256-color cube approximations for all palette colors when Truecolor is unsupported.

### Changed
- **Animation Rhythms**: Refined frame sequences for `heartbeat` (lub-dub), `runner`, and `bunnyEat` spinners to remove duplicate frames and improve movement loops.
- **Package Exports**: Updated `package.json#main` and `exports` to point to the production-ready `dist/` bundle.


## [1.0.0] — 2026-04-14

### Added
- **Spinners**: 12 animation types with `Spinner`, `MultiSpinner`, and `Spinner.promise()` helper
- **Progress bars**: 6 styles with `ProgressBar` and `MultiBar`, ETA and rate display
- **Banner**: Custom 5×5 block-letter ASCII art (A–Z, 0–9, punctuation)
- **Box**: 6 border styles with title, footer, and content alignment
- **Table**: Data table renderer with per-column alignment and max width truncation
- **Logger**: Structured log output with levels, timestamps, key-value pairs, and step sequences
- **Divider, Header, Badge**: Layout helpers for structured terminal output
- **Environment detection**: TTY detection, `NO_COLOR` / `FORCE_COLOR` support
- **SIGINT safety**: Cursor is restored on Ctrl+C during spinner/progress animations
- **Non-TTY fallback**: Spinners print final state only; progress bars print at milestones
- **TypeScript types**: Full `.d.ts` type definitions for all exports
- **Zero runtime dependencies**
