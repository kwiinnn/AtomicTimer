import type { UiStyle } from '../../core/settings';
import { compositeOver, mix } from './palettes';
import type { ResolvedTheme } from './resolve';

/** Content panels (lists, cards) vs the floating layer (bars, menus, dialogs, controls). */
export type SurfaceKind = 'content' | 'float';
export interface Layer { fillAlpha: number; blurPx: number; saturate: number; lens: boolean }
export interface StyleTokens {
  /** Cards and dialogs, px. */
  radius: number;
  control: 'default' | 'pill' | 'flat' | 'outlined' | 'block';
  content: Layer;
  float: Layer;
  border: 'none' | 'hairline' | 'highlight' | 'heavy';
  shadow: 'material' | 'none' | 'soft' | 'hard';
}

const solid: Layer = { fillAlpha: 1, blurPx: 0, saturate: 1, lens: false };
const clear: Layer = { fillAlpha: 0, blurPx: 0, saturate: 1, lens: false };

export const STYLE_TOKENS: Record<UiStyle, StyleTokens> = {
  material: { radius: 8, control: 'default', content: solid, float: solid, border: 'none', shadow: 'material' },
  // Floating glass keeps its blur light: more than ~3px washes out the lens (see plan, spike outcome).
  glass: {
    radius: 24, control: 'pill',
    content: { fillAlpha: 0.55, blurPx: 20, saturate: 1.6, lens: false },
    float: { fillAlpha: 0.35, blurPx: 3, saturate: 1.8, lens: true },
    border: 'highlight', shadow: 'soft',
  },
  flat: { radius: 12, control: 'flat', content: solid, float: solid, border: 'none', shadow: 'none' },
  outline: { radius: 12, control: 'outlined', content: clear, float: clear, border: 'hairline', shadow: 'none' },
  brutalist: { radius: 0, control: 'block', content: solid, float: solid, border: 'heavy', shadow: 'hard' },
};

export const PAPER = { light: '#ffffff', dark: '#1e1e1e' } as const;

/** Opaque base colour of a surface before alpha: paper, or for Flat a tint of paper toward the gradient. */
export function surfaceBase(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme): string {
  const paper = PAPER[r.mode];
  if (style === 'flat') return mix(paper, r.stops[0], kind === 'content' ? 0.12 : 0.06);
  return paper;
}

/** The colour text actually sits on: the surface at its fill alpha over `behind`. */
export function effectiveSurface(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme, behind: string): string {
  return compositeOver(surfaceBase(style, kind, r), STYLE_TOKENS[style][kind].fillAlpha, behind);
}
