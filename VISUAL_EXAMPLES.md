# Lumi Visual Design Examples

Visual demonstrations of enhanced terminal UI components with modern design patterns.

## Logger Output

### Step Sequences
**Before:**
```
  ─── 1/7 Checkout
  ─── 2/7 Install
  ─── 3/7 Lint
```

**After:**
```
  ▸ ▪░░░░░░ 1/7  Checkout
  ▸ ▪▪░░░░░ 2/7  Install
  ▸ ▪▪▪░░░░ 3/7  Lint
```

### Key-Value Display
**Before:**
```
  NODE_ENV···········production
  REGION·············ap-south-1
  MEMORY·············7.8 GB / 8 GB
```

**After:**
```
  │ NODE_ENV · · · · · production
  │ REGION · · · · · · ap-south-1
  │ MEMORY · · · · · · 7.8 GB / 8 GB
```

## Progress Bars

### Modern Styles
Available progress bar styles with visual demonstrations:

**block** (classic, high-contrast)
```
▸ Build Progress [████████░░░░░░░░░░░░░░░░] 30% 15/50 ⏱ 1m34s ↯ 9.2/s
```

**modern** (sleek squares)
```
▸ Build Progress [▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱] 35% 17/50 ⏱ 1m22s ↯ 10.1/s
```

**fluid** (wave-like)
```
▸ Build Progress [▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░] 25% 12/50 ⏱ 2m05s ↯ 8.5/s
```

**arrow** (directional)
```
▸ Build Progress [━━━━━━━▶─────────────────────] 40% 20/50 ⏱ 1m10s ↯ 11.3/s
```

## Spinner Outcomes

### Spinner Results with Enhanced Styling
```
  ▸ Bundler  ✔ Bundle optimized  156ms
  ▸ Tests    ✔ All tests passing  2.3s
  ▸ Deploy   ✘ Connection failed  423ms
  ▸ CDN      ⚠ Partial push       1.2s
  ▸ Monitor  ℹ Metrics collected  892ms
```

### Multi-line Spinners with Frames
```
  │  /\_/\  
  │ =( °w° )=
  │  )   ( //
  │ (__ __)/
  ◆ Cat walk animation complete
```

## Tables with Visual Enhancements

### Highlighted Rows and Cells
```
┌─────────────────────┬──────────┬─────────┐
│ Service             │ Status   │ Uptime  │
├─────────────────────┼──────────┼─────────┤
◆│ API Server         │ Running  │ 99.9%   │
 │ Database           │ Running  │ 100%    │
 │ Cache              │ Stopped  │ 0%      │
 │ Message Queue      │ Running  │ 97.2%   │
└─────────────────────┴──────────┴─────────┘
```

## Status Bars

### Bottom Status Line with Segments
```
▸ ⚡ Building │ CPU 42% │ Memory 1.2GB │ Files 234
```

### Compact Layout
```
▸ ⚡ Ready │ Node 22.2.0 │ npm 10.5.0
```

## Boxes with Titles and Decorations

### Standard Box
```
┌─ ◆ Build Summary ───────────────────────┐
│                                         │
│ ✔ Compiled 1,247 files                 │
│ ✔ Bundle size: 148.3 KB (gzip)         │
│ ✔ Tree-shaking removed 89 KB           │
│ ⚠ 2 TypeScript warnings                │
│                                         │
└─────────────────────────────────────────┘
```

### Glowing Box (emphasis)
```
✦ ┌──────────────────────────────────────┐
  │ ◆ Deployment Complete                │
  │                                      │
  │ ✔ Live on production                 │
  │ ✔ DNS propagated                     │
  │ ✔ SSL certificate valid              │
  │ ✔ All health checks passing          │
  │                                      │
  └──────────────────────────────────────┘
```

## Color Usage

### Semantic Color Palette
```
sage (success)    ✔ Operation completed
signal (error)    ✘ Critical failure
amber (warning)   ⚠ Requires attention
azure (info)      ℹ Information provided
lavender (accent) ◆ Highlights & markers
slate (default)   Standard text
mist (secondary)  De-emphasized content
```

## Interactive Spinner Gallery

### Basic Spinners
```
⠋ braille     ─ line       ◐ arc        ⣾ grid
▁ wave        ⣿ cyber      ⠁ snake      ⠁ bounce
█ fade        ╱ slash      ▏ grow       · ripple
ᗧ runner      ♡ heartbeat
```

### Pet Spinners
```
(=^・ω・^=) catChase     ( ᐡ • ﻌ • ᐡ ) dogFetch
₍ᐢ•ﻌ•ᐢ₎ bunnyEat      ϵ( 'Θ' )϶ fishSwim
ʕ •ᴥ• ʔ bearHoney    🐛 caterpillar
```

### Multi-line Pets
```
  /\_/\          ∪・ω・∪         (\\(\
=( °w° )=        / |    |\~       ( -.-)
 )   ( //        |    |          o_(")(")
(__ __)//        d    b
```

## Usage Examples

### Logger with Enhanced Styling
```javascript
import { createLogger } from '@nijil71/lumi-cli';

const logger = createLogger({ timestamps: true, prefix: 'APP' });

// Step sequences with visual progress
logger.step(1, 5, 'Initializing runtime');
logger.step(2, 5, 'Loading configuration');
logger.step(3, 5, 'Connecting to database');

// KV pairs with better alignment
logger.kv('Port', '3000');
logger.kv('Environment', 'production');
logger.kv('Memory Usage', '234 MB / 512 MB');
```

### Progress Bar with Multiple Styles
```javascript
import { ProgressBar, GRADIENTS } from '@nijil71/lumi-cli';

// Modern style with ETA
const bar = new ProgressBar({
  total: 100,
  style: 'modern',
  color: 'azure',
  label: 'Building',
  eta: true,
  rate: true
});

bar.start();
for (let i = 0; i < 100; i++) {
  bar.increment();
}
bar.complete('Build succeeded');
```

### Table with Highlighting
```javascript
import { table } from '@nijil71/lumi-cli';

const services = [
  { name: 'API Server', status: 'Running', uptime: '99.9%' },
  { name: 'Database', status: 'Running', uptime: '100%' },
  { name: 'Cache', status: 'Stopped', uptime: '0%' }
];

table(services, {
  border: 'single',
  highlight: { columnName: 'status', value: 'Running' },
  color: 'azure'
});
```

### Status Bar with Segments
```javascript
import { StatusBar } from '@nijil71/lumi-cli';

const bar = new StatusBar({
  segments: [
    { icon: '⚡', text: 'Building' },
    { icon: '💾', text: 'CPU 42%', color: 'azure' },
    { icon: '🧠', text: 'Memory 78%', color: 'amber' }
  ]
});

bar.render();
// ... do work ...
bar.clear();
```

## Design Principles Demonstrated

1. **Visual Markers**: Arrows (▸), diamonds (◆), sparkles (✦) guide attention
2. **Semantic Color**: Green=success, red=error, yellow=warning, blue=info
3. **Professional Polish**: Consistent spacing, clean borders, readable fonts
4. **Accessibility**: Color + symbols, never relying on color alone
5. **Performance**: Smooth animations, efficient rendering, instant feedback
