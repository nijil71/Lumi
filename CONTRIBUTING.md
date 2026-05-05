# Contributing to lumi-cli

Thanks for your interest in contributing.

## Development

```bash
git clone https://github.com/nijil71/Lumi.git
cd Lumi
npm install
npm test        # run smoke tests
npm run demo    # run the interactive showcase
```

## Project structure

```
src/
├── ansi.js         ANSI escapes, palette, terminal detection
├── index.js        re-exports everything
├── types.d.ts      TypeScript type definitions
├── spinners/       Spinner, MultiSpinner
├── progress/       ProgressBar, MultiBar
├── banner/         banner, divider, header, badge
├── box/            box, columns
├── table/          table
└── logger/         log, createLogger
```

## Guidelines

- **Zero dependencies.** Don't add runtime dependencies. Dev dependencies are fine for testing.
- **Pure ESM.** No CommonJS. Use `import`/`export` everywhere.
- **Node ≥ 18.** You can use any API available in Node.js 18+.
- **Test your changes.** Run `npm test` before submitting. Add tests for new features.
- **Respect NO_COLOR.** Any new component that emits color must check `colorLevel()` or use the shared `c` palette (which already handles it).

## Design & Visual Guidelines

When adding new components or enhancing existing ones:

### Color Usage
- **Always use the 7-color palette:** `chalk`, `signal`, `sage`, `azure`, `amber`, `lavender`, `dim`
- **Never hardcode ANSI codes.** Use the `c` object from `ansi.js`
- **Semantic meaning:** Error=signal, Success=sage, Info=azure, Warning=amber, Accent=lavender
- **Respect fallbacks:** The palette degrades gracefully to 256-color or 16-color terminals

### Visual Hierarchy
- **Spacing matters.** Use consistent padding and line breaks for readability
- **Borders create structure.** Use appropriate border styles (rounded for friendly, thick for emphasis, ascii for compatibility)
- **Typography via layout.** Fixed-width fonts mean spacing creates visual rhythm—use it intentionally

### Demo Showcase Quality
- **Cinematic flow.** Demos should build from simple to complex, with pauses for visual processing
- **Progressive disclosure.** Show core functionality first, then variations and advanced features
- **Live feedback.** Use animations (spinners, progress) to show system activity realistically
- **Consistent theming.** Pick gradient presets that match the component's purpose

### Best Practices for New Components
1. **Validate with `.isTTY()`** — Degrade gracefully in non-interactive environments
2. **Support --slow and --fast** — Demo should be fast-forward friendly
3. **Use semantic symbols** — ✔, ✘, ⚠, ℹ, ◆ convey intent instantly
4. **Test alignment** — Variables-width output needs careful padding calculations
5. **Document with examples** — README examples should be production-ready

## Submitting changes

1. Fork the repo and create a feature branch
2. Make your changes
3. Run `npm test`
4. Open a pull request with a clear description

## Reporting bugs

Open an issue at https://github.com/nijil71/Lumi/issues with:
- Node.js version (`node --version`)
- Terminal emulator name and OS
- Steps to reproduce
- Expected vs actual behavior
