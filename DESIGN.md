# Lumi Design System

This document outlines the visual design philosophy, color system, and best practices for creating beautiful CLI experiences with lumi-cli.

---

## Design Philosophy

Lumi embraces **functional minimalism** — every visual element serves a purpose. We prioritize:

- **Clarity** — Information hierarchy is obvious at a glance
- **Consistency** — Repeated patterns create predictability and trust
- **Functionality** — Visual design supports task completion, never obscures it
- **Performance** — Terminal rendering is fast; animations are smooth, not jarring
- **Accessibility** — Color + symbols ensure readability for all users

---

## Color Palette

Lumi's 7-color palette is semantic, accessible, and carefully calibrated for terminal environments.

| Color | Hex | Use Cases | Meaning |
|-------|-----|-----------|---------|
| **chalk** | #EBEBF0 | Default text, labels, body content | Neutral, primary |
| **signal** | #FF504C | Errors, critical alerts, failures | Danger, urgency |
| **sage** | #50C88C | Success states, affirmations | Positive, complete |
| **azure** | #3CA0FF | Information, links, highlights | Informative, active |
| **amber** | #FFB928 | Warnings, caution, attention | Warning, pending |
| **lavender** | #B48CFF | Accents, decorative elements | Secondary highlight |
| **dim** | #5A5A69 | Muted text, disabled, secondary | Inactive, unimportant |

### Usage Examples

```js
import { c, writeln } from '@nijil71/lumi-cli';

// Status feedback
writeln(`${c.sage}✔${c.r} Deploy successful`);      // success
writeln(`${c.signal}✘${c.r} Build failed`);           // error
writeln(`${c.amber}⚠${c.r} Memory low`);              // warning
writeln(`${c.azure}ℹ${c.r} New version available`);   // info

// Text emphasis
writeln(`${c.lavender}${c.b}Important${c.r} detail`); // accent + bold
writeln(`${c.dim}Skipped 3 tests${c.r}`);             // muted
```

### Color Contrast & Accessibility

- **High contrast.** All colors meet WCAG AA standards against default terminal backgrounds
- **Symbol redundancy.** Never rely on color alone; combine with text or icons (✔, ✘, ⚠)
- **NO_COLOR support.** Respect the `NO_COLOR` environment variable; gracefully strip colors when requested
- **Terminal degradation.** Palette automatically adapts to 256-color and 16-color terminals

---

## Visual Elements

### Typography & Text

- **Monospace font.** Fixed-width assumption enables predictable layouts
- **Character spacing.** One space = one column; padding is built from spaces
- **Line height.** 1 space between logical sections improves readability
- **Alignment.** Use `padEnd()` and `visibleLen()` for variable-width Unicode

```js
import { visibleLen, padEnd } from '@nijil71/lumi-cli';

const key = 'NODE_ENV';
const value = 'production';
writeln(padEnd(key, 20, ' ') + value);  // aligned columns
```

### Borders & Boxes

6 border styles serve different contexts:

| Style | Chars | Use Case | Visual Feel |
|-------|-------|----------|------------|
| `rounded` | ╭ ╮ ╰ ╯ | Friendly messages, info | Modern, approachable |
| `single` | ┌ ┐ └ ┘ | Tables, standard content | Clean, professional |
| `double` | ╔ ╗ ╚ ╝ | Alerts, emphasis | Bold, important |
| `thick` | ┏ ┓ ┗ ┛ | Critical errors, highlights | Strong, urgent |
| `dashed` | ┌ ┐ └ ┘ + ─ ╶ | Optional info, lightweight | Subtle, secondary |
| `ascii` | + - \| | Legacy terminals, compatibility | Universal, plain |

```js
import { box } from '@nijil71/lumi-cli';

// Friendly info
box('Setup complete!', { border: 'rounded', color: 'sage' });

// Critical error
box('Service unreachable', { border: 'thick', color: 'signal' });

// Important notice
box('⚠ Database will be wiped', { border: 'double', color: 'amber' });
```

### Icons & Symbols

Use semantic symbols to convey status instantly:

| Symbol | Meaning | Color | Context |
|--------|---------|-------|---------|
| ✔ | Success, complete | sage | Task completion, affirmations |
| ✘ | Failure, error | signal | Failed tasks, errors |
| ⚠ | Warning, caution | amber | Warnings, attention needed |
| ℹ | Information | azure | Info messages, tips |
| ◆ | Debug, meta | lavender | Debug output, timestamps |
| → | Direction, next | lavender | Navigation, step indicators |
| ✦ | Decorative accent | varies | Dividers, separators |

### Gradients

Lumi includes 8 preset gradients for visual impact:

```js
import { gradient, GRADIENTS } from '@nijil71/lumi-cli';

// Preset gradients
writeln(gradient('Neon edge computing', ...GRADIENTS.neon));     // Purple → Cyan
writeln(gradient('Warning: fire ahead', ...GRADIENTS.fire));     // Red → Amber
writeln(gradient('Cool as ice', ...GRADIENTS.ice));              // Blue → Sky
writeln(gradient('Sunset vibes', ...GRADIENTS.sunset));          // Red → Lavender
writeln(gradient('Matrix aesthetic', ...GRADIENTS.matrix));      // Green gradient
writeln(gradient('Golden hour', ...GRADIENTS.gold));             // Gold → Orange
writeln(gradient('New beginning', ...GRADIENTS.dawn));           // Pink → Amber
writeln(gradient('Ocean depths', ...GRADIENTS.ocean));           // Sky → Deep Blue
```

Use gradients strategically:
- **Banners & titles** — grab attention, set mood
- **Section dividers** — visual separation, thematic consistency
- **Highlights** — emphasize key information
- **One per section** — too many gradients feel chaotic

---

## Layout & Spacing

### Visual Hierarchy

1. **Banner** (gradient ASCII art) — Sets the tone, captures attention
2. **Header** (section title) — Orients the user to content
3. **Body** (content) — Primary information
4. **Footer** (metadata) — Secondary info, timestamps

### Breathing Room

```js
// ✗ Cramped — no readability
writeln('First line');
writeln('Second line');

// ✓ Readable — intentional spacing
writeln('First section');
writeln();  // blank line for breathing room
writeln('Second section');
```

### Section Structure

```js
// Optimal demo section flow
function demoFeature() {
  sectionDivider('FEATURE NAME', GRADIENTS.neon);  // visual separator
  header('short label', 'description of what this shows');  // orientation
  writeln();  // breathing room
  
  // Content here
  
  writeln();  // trailing space before next section
}
```

---

## Animation & Motion

### Spinners

- **Purpose** — Show that work is happening, no hang
- **Duration** — Typically 60–200ms per frame for smooth motion
- **Color** — Match the context (azure for info, sage for success, signal for errors)

```js
import { Spinner } from '@nijil71/lumi-cli';

const sp = new Spinner({
  type: 'wave',                // 25 types available
  text: 'Compiling…',
  color: 'azure',              // semantic color
  elapsed: true,               // show elapsed time
});
sp.start();
// ... work ...
sp.succeed('Compiled successfully');  // replaces with checkmark
```

### Progress Bars

- **Purpose** — Show progress for long-running operations
- **6 styles** — Match the aesthetic (block for bold, dots for subtle)
- **ETA & rate** — Show how long until completion, speed of progress

```js
import { ProgressBar } from '@nijil71/lumi-cli';

const bar = new ProgressBar({
  total: 100,
  style: 'block',              // or: shaded, bracket, thin, brutalist, dots
  color: 'azure',
  label: 'uploading',
  eta: true,                   // show estimated time remaining
  rate: true,                  // show items/sec
});
bar.start();
for (let i = 0; i <= 100; i++) {
  bar.update(i);
  await work();
}
bar.complete('Done!');
```

---

## Demo Best Practices

When creating demos or examples:

### 1. Cinematic Flow

- **Open with impact** — Gradient banner, clear title
- **Build complexity** — Simple components first, then combinations
- **Pause for processing** — Let humans read output before moving on
- **Close with summary** — Recap what was shown

### 2. Interactive Feel

- **Live updates** — Spinners, progress bars, status changes
- **Consistent pacing** — Use `--slow` and `--fast` flags for flexibility
- **Responsive to input** — Skip/quit via keyboard during cinematic sections

```js
// From demo.js — the navigator pattern
await pause(300);              // user can skip with space or q
sectionDivider('NEXT SECTION');
```

### 3. Professional Appearance

- **Aligned columns** — Use `padEnd()` for tables and key-value pairs
- **Color restraint** — 2–3 colors per section, use palette semantically
- **Whitespace** — Line breaks between logical sections
- **Semantic icons** — ✔, ✘, ⚠ tell the story instantly

---

## Real-world Example

```js
import { banner, box, table, Spinner, log, gradient, GRADIENTS } from '@nijil71/lumi-cli';

async function deploy() {
  // 1. Opener — visual impact
  banner('DEPLOY', { gradient: GRADIENTS.neon, align: 'center' });
  writeln();

  // 2. Steps with progress
  log.step(1, 3, 'Running tests');
  const testSpinner = new Spinner({ type: 'wave', text: 'testing…', color: 'azure' });
  testSpinner.start();
  await runTests();
  testSpinner.succeed('42 tests passed');
  writeln();

  // 3. Progress bar
  log.step(2, 3, 'Building bundle');
  const bar = new ProgressBar({ total: 100, style: 'block', color: 'lavender' });
  bar.start();
  for (let i = 0; i <= 100; i++) {
    bar.update(i);
    await buildStep();
  }
  bar.complete('Bundle ready');
  writeln();

  // 4. Results summary
  log.step(3, 3, 'Deployment');
  const deploySpinner = new Spinner({ type: 'arc', text: 'uploading…', color: 'sage' });
  deploySpinner.start();
  await uploadBundle();
  deploySpinner.succeed('Deployed to production');
  writeln();

  // 5. Closing — clear outcome
  box(['✔ All systems nominal', 'Build a3f9c12 is live on 34 edge nodes'],
    { border: 'rounded', color: 'sage', padding: 1 });
}
```

---

## Technical Considerations

### Performance

- **Render speed** — Lumi renders 3M+ spinners/sec; don't optimize prematurely
- **Terminal reflow** — Use `cols()` and `rows()` to adapt to window size
- **ANSI codes** — Minimal overhead; gracefully strip when `NO_COLOR` is set

### Compatibility

- **Truecolor fallback** — Automatically degrade to 256-color or 16-color
- **Non-TTY environments** — CI/CD friendly; spinners become single-line logs
- **Windows Terminal** — Full support including OSC 8 hyperlinks

### Testing

- Run demos with `npm run demo` (full speed)
- Use `npm run demo -- --slow` for presentation mode
- Test in different terminal emulators (iTerm2, Windows Terminal, GNOME Terminal, Kitty, WezTerm)
- Check `NO_COLOR=1 npm run demo` for non-color output

---

## Summary

Beautiful CLI design is **intentional, consistent, and purposeful**. Use Lumi's tools to:

1. **Communicate clearly** — Color, icons, and text work together
2. **Respect the user** — Fast, responsive, non-blocking operations
3. **Build confidence** — Consistent styling creates trust
4. **Delight** — Smooth animations and thoughtful spacing make CLI enjoyable

For more examples, run `npx lumi demo` and explore the source code in `demo.js`.
