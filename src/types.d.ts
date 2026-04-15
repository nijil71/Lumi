// ─── Type definitions for lumi-cli ───────────────────────────────────────

// ─── ANSI utilities ───────────────────────────────────────────────────────

export declare const ESC: string;

export declare const ansi: {
  up(n?: number): string;
  down(n?: number): string;
  right(n?: number): string;
  left(n?: number): string;
  col(n?: number): string;
  pos(r: number, c: number): string;
  hide(): string;
  show(): string;
  save(): string;
  restore(): string;
  clearLine(): string;
  clearDown(): string;
  reset: string;
  bold: string;
  dim: string;
  italic: string;
  underline: string;
  strikethrough: string;
  fg(n: number): string;
  bg(n: number): string;
  rgb(r: number, g: number, b: number): string;
  bgRgb(r: number, g: number, b: number): string;
  /** OSC 8 clickable hyperlink. Falls back to plain text in unsupported terminals. */
  link(text: string, url: string): string;
};

export declare const c: {
  ink: string;
  carbon: string;
  graphite: string;
  slate: string;
  mist: string;
  fog: string;
  chalk: string;
  white: string;
  signal: string;
  amber: string;
  sage: string;
  azure: string;
  lavender: string;
  bgInk: string;
  bgCarbon: string;
  bgGraphite: string;
  bgSignal: string;
  bgSage: string;
  bgAmber: string;
  bgAzure: string;
  r: string;
  b: string;
  d: string;
};

export declare function isTTY(): boolean;
export declare function colorLevel(): 0 | 1 | 2 | 3;
export declare function getColorTheme(name: string): (text: string) => string;
export declare function write(str: string): void;
export declare function writeln(str?: string): void;
export declare function cols(): number;
export declare function rows(): number;
export declare function stripAnsi(str: string): string;
export declare function visibleLen(str: string): number;
export declare function padEnd(str: string, width: number, char?: string): string;
export declare function truncate(str: string, width: number): string;

/** RGB tuple [r, g, b] where each value is 0–255. */
export type RGB = [number, number, number];

/**
 * Apply a left-to-right truecolor gradient to a string.
 * Falls back to plain text on terminals without truecolor support.
 */
export declare function gradient(text: string, fromRGB: RGB, toRGB: RGB): string;

/** Built-in gradient presets. Spread into gradient(): `gradient(t, ...GRADIENTS.neon)` */
export declare const GRADIENTS: {
  neon:    [RGB, RGB];
  fire:    [RGB, RGB];
  ice:     [RGB, RGB];
  sunset:  [RGB, RGB];
  matrix:  [RGB, RGB];
  gold:    [RGB, RGB];
  dawn:    [RGB, RGB];
  ocean:   [RGB, RGB];
};

// ─── Spinners ─────────────────────────────────────────────────────────────

export type SpinnerType =
  // originals
  | 'braille' | 'block' | 'cross' | 'orbital' | 'pulse' | 'dash'
  | 'grid' | 'triangle' | 'snake' | 'signal' | 'clock' | 'morph'
  // new
  | 'arc' | 'line' | 'star' | 'wave' | 'balloon' | 'cyber' | 'flip' | 'meter';

export type ColorName =
  | 'default' | 'chalk' | 'signal' | 'sage' | 'azure'
  | 'amber' | 'lavender' | 'dim';

export interface SpinnerOptions {
  type?: SpinnerType;
  text?: string;
  color?: ColorName;
  prefix?: string;
  elapsed?: boolean;
}

export interface SpinnerPromiseOptions extends SpinnerOptions {
  successText?: string;
  failText?: string;
}

export declare const SPINNERS: Record<SpinnerType, { interval: number; frames: string[] }>;

export declare class Spinner {
  constructor(options?: SpinnerOptions);
  start(text?: string): this;
  setText(text: string): this;
  setColor(name: ColorName): this;
  succeed(text?: string): void;
  fail(text?: string): void;
  warn(text?: string): void;
  info(text?: string): void;
  stop(): void;
  static promise<T>(promise: Promise<T>, options?: SpinnerPromiseOptions): Promise<T>;
}

export declare function spinner(textOrOptions: string | SpinnerOptions): Spinner;

export declare class MultiSpinner {
  add(textOrOptions: string | SpinnerOptions): number;
  succeed(idx: number, text?: string): void;
  fail(idx: number, text?: string): void;
  warn(idx: number, text?: string): void;
  info(idx: number, text?: string): void;
  start(): this;
  stop(): void;
}

// ─── Progress ─────────────────────────────────────────────────────────────

export type ProgressStyle = 'block' | 'shaded' | 'bracket' | 'thin' | 'brutalist' | 'dots';

export interface ProgressBarOptions {
  total?: number;
  current?: number;
  style?: ProgressStyle;
  color?: ColorName;
  label?: string;
  width?: number;
  eta?: boolean;
  rate?: boolean;
}

export declare class ProgressBar {
  constructor(options?: ProgressBarOptions);
  start(): this;
  update(current: number, label?: string): this;
  increment(by?: number, label?: string): this;
  complete(text?: string): void;
  clear(): void;
  stop(): void;
}

export declare function progressBar(options?: ProgressBarOptions): ProgressBar;

export declare class MultiBar {
  add(options?: ProgressBarOptions): number;
  update(idx: number, current: number, label?: string): void;
  start(): this;
  tick(): this;
  stop(): void;
}

// ─── Banner ───────────────────────────────────────────────────────────────

export interface BannerOptions {
  color?: ColorName;
  /** Truecolor gradient: [fromRGB, toRGB]. Overrides `color` when supported. */
  gradient?: [RGB, RGB];
  char?: string;
  gap?: number;
  align?: 'left' | 'center' | 'right';
  pad?: number;
}

export declare function banner(text: string, options?: BannerOptions): void;

export interface DividerOptions {
  width?: number;
  char?: string;
  label?: string;
  color?: ColorName;
}

export declare function divider(options?: DividerOptions): void;

export interface HeaderOptions {
  width?: number;
  color?: ColorName;
}

export declare function header(title: string, subtitle?: string, options?: HeaderOptions): void;

export type BadgeType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface BadgeOptions {
  type?: BadgeType;
}

export declare function badge(text: string, options?: BadgeOptions): string;

// ─── Box ──────────────────────────────────────────────────────────────────

export type BorderStyle = 'single' | 'double' | 'rounded' | 'thick' | 'dashed' | 'ascii';

export interface BoxOptions {
  border?: BorderStyle;
  color?: ColorName;
  title?: string;
  footer?: string;
  padding?: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export declare function box(content: string | string[], options?: BoxOptions): void;

export interface ColumnData {
  content: string | string[];
}

export interface ColumnsOptions {
  width?: number;
  gap?: number;
}

export declare function columns(data: ColumnData[], options?: ColumnsOptions): void;

// ─── Table ────────────────────────────────────────────────────────────────

export type TableBorder = 'single' | 'thick' | 'double' | 'minimal';

export interface TableOptions {
  border?: TableBorder;
  color?: ColorName;
  headers?: string[];
  width?: number;
  align?: Record<string, 'left' | 'right' | 'center'>;
  maxWidth?: Record<string, number>;
}

export declare function table(data: Record<string, unknown>[], options?: TableOptions): void;

// ─── Logger ───────────────────────────────────────────────────────────────

export interface LoggerOptions {
  timestamps?: boolean;
  prefix?: string;
}

export interface KvOptions {
  keyWidth?: number;
}

export declare class Logger {
  constructor(options?: LoggerOptions);
  info(...args: unknown[]): this;
  success(...args: unknown[]): this;
  warn(...args: unknown[]): this;
  error(...args: unknown[]): this;
  debug(...args: unknown[]): this;
  log(...args: unknown[]): this;
  step(n: number, total: number, text: string): this;
  kv(key: string, value: string, options?: KvOptions): this;
  br(): this;
  raw(text: string): this;
}

export declare const log: Logger;
export declare function createLogger(options?: LoggerOptions): Logger;

// ─── Sparkline ────────────────────────────────────────────────────────────

export interface SparklineOptions {
  color?: ColorName;
  min?: number;
  max?: number;
}

/**
 * Render an array of numbers as a compact inline block-character sparkline.
 * Returns a colored string — no newline appended.
 * @example log.kv('CPU', sparkline([12, 45, 78, 34, 90]));
 */
export declare function sparkline(values: number[], options?: SparklineOptions): string;

// ─── Tree ─────────────────────────────────────────────────────────────────

export type TreeNode = null | string[] | Record<string, TreeNode>;

export interface TreeOptions {
  color?: ColorName;
  dirColor?: ColorName;
  lineColor?: ColorName;
}

/**
 * Render a nested object or array as a tree with box-drawing connectors.
 * @example tree({ 'src/': { 'index.js': null }, 'package.json': null });
 */
export declare function tree(data: Record<string, TreeNode> | string[], options?: TreeOptions): void;

// ─── Diff ─────────────────────────────────────────────────────────────────

export interface DiffOptions {
  context?: number;
  oldLabel?: string;
  newLabel?: string;
  lineNumbers?: boolean;
}

/**
 * Print a colored line-by-line diff between two strings.
 * Added lines in green (+), removed in red (─), context lines in dim.
 */
export declare function diff(oldText: string, newText: string, options?: DiffOptions): void;

// ─── StatusBar ────────────────────────────────────────────────────────────

export interface StatusBarOptions {
  left?: string;
  center?: string;
  right?: string;
}

/**
 * A persistent status line pinned to the bottom row of the terminal.
 * Uses cursor save/restore — never interrupts normal output.
 */
export declare class StatusBar {
  constructor(options?: StatusBarOptions);
  update(parts: Partial<StatusBarOptions>): this;
  render(): this;
  clear(): this;
}

export declare function statusBar(options?: StatusBarOptions): StatusBar;

// ─── Prompt ───────────────────────────────────────────────────────────────

export interface ConfirmOptions {
  default?: boolean;
}

/** Ask a yes/no question. Returns `Promise<boolean>`. */
export declare function confirm(message: string, options?: ConfirmOptions): Promise<boolean>;

export type SelectChoice = string | { label: string; value: string };

export interface SelectOptions {
  default?: string;
}

/** Arrow-key selection from a list. Returns `Promise<string>`. */
export declare function select(
  message: string,
  choices: SelectChoice[],
  options?: SelectOptions
): Promise<string>;

export interface InputOptions {
  default?: string;
  placeholder?: string;
  password?: boolean;
}

/** Free-text input prompt. Returns `Promise<string>`. */
export declare function input(message: string, options?: InputOptions): Promise<string>;
