import type { UiStyle } from '../../core/settings';
import { compositeOver, contrastRatio, mix } from './palettes';
import type { ResolvedTheme } from './resolve';

/**
 * Content panels (lists, cards); the docked floating layer (toolbar, tab strip); and pop-ups
 * (dialogs, menus, drawer, snackbars), which sit over a dimmed backdrop or straight over text.
 */
export type SurfaceKind = 'content' | 'float' | 'overlay';
export interface Layer {
  fillAlpha: number;
  blurPx: number;
  saturate: number;
  lens: boolean;
  /** Lighter blur used only where the lens renders (heavier blur erases it); see LensLayer. */
  lensBlurPx?: number;
}
export interface StyleTokens {
  /** Cards and dialogs, px. */
  radius: number;
  /** MUI shape.borderRadius: the unit sx radii (1–2) multiply, so hand-built cards land near `radius`. */
  unit: number;
  control: 'default' | 'pill' | 'flat' | 'outlined' | 'block';
  content: Layer;
  float: Layer;
  overlay: Layer;
  border: 'none' | 'hairline' | 'highlight' | 'heavy';
  shadow: 'material' | 'none' | 'soft' | 'hard';
}

const solid: Layer = { fillAlpha: 1, blurPx: 0, saturate: 1, lens: false };
const clear: Layer = { fillAlpha: 0, blurPx: 0, saturate: 1, lens: false };

export const STYLE_TOKENS: Record<UiStyle, StyleTokens> = {
  material: { radius: 8, unit: 8, control: 'default', content: solid, float: solid, overlay: solid, border: 'none', shadow: 'material' },
  // Bars keep their blur light: more than ~3px washes out the lens (see plan, spike outcome).
  // Pop-ups are more frosted, like iOS menus, so text behind them never competes with theirs.
  glass: {
    radius: 24, unit: 12, control: 'pill',
    content: { fillAlpha: 0.55, blurPx: 20, saturate: 1.6, lens: false },
    float: { fillAlpha: 0.35, blurPx: 12, saturate: 1.8, lens: true, lensBlurPx: 3 },
    overlay: { fillAlpha: 0.7, blurPx: 16, saturate: 1.8, lens: true },
    border: 'highlight', shadow: 'soft',
  },
  flat: { radius: 12, unit: 6, control: 'flat', content: solid, float: solid, overlay: solid, border: 'none', shadow: 'none' },
  // Pop-ups stay nearly solid so they read over whatever they cover.
  outline: { radius: 12, unit: 6, control: 'outlined', content: clear, float: clear, overlay: { ...solid, fillAlpha: 0.92 }, border: 'hairline', shadow: 'none' },
  brutalist: { radius: 0, unit: 0, control: 'block', content: solid, float: solid, overlay: solid, border: 'heavy', shadow: 'hard' },
};

export const PAPER = { light: '#ffffff', dark: '#1e1e1e' } as const;

/** Opaque base colour of a surface before alpha: paper, or for Flat a tint of paper toward the gradient. */
export function surfaceBase(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme): string {
  const paper = PAPER[r.mode];
  if (style === 'flat') return mix(paper, r.stops[0], kind === 'content' ? 0.12 : 0.06);
  return paper;
}

/**
 * The style's fill alpha, raised (in 0.05 steps) until text reads on both gradient stops —
 * a light-to-dark custom gradient defeats see-through panels whichever ink it gets.
 */
export function fillAlpha(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme): number {
  const base = surfaceBase(style, kind, r);
  const reads = (a: number) => r.stops.every(s => contrastRatio(r.ink, compositeOver(base, a, s)) >= 4.5);
  let a = STYLE_TOKENS[style][kind].fillAlpha;
  while (a < 1 && !reads(a)) a = Math.min(1, Math.round((a + 0.05) * 100) / 100);
  return a;
}

/** The colour text actually sits on: the surface at its fill alpha over `behind`. */
export function effectiveSurface(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme, behind: string): string {
  return compositeOver(surfaceBase(style, kind, r), fillAlpha(style, kind, r), behind);
}

/** Surfaces on the floating layer (Apple's glass layer): lensed in Glass, and solid under reduced transparency. */
export const FLOAT_SELECTOR = '.MuiAppBar-root, .MuiDialog-paper, .MuiPopover-paper, .MuiDrawer-paper, .MuiSnackbarContent-root, .glass-tabs, [data-surface="float"]';
