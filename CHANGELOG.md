# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
