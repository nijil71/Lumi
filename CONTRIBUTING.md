# Contributing to lumina-cli

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
