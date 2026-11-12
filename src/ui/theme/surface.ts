import { alpha, lighten, type Theme } from '@mui/material/styles';
import type { CSSObject } from '@mui/material/styles';
import type { UiStyle } from '../../core/settings';
import type { ResolvedTheme } from './resolve';
import { mix } from './palettes';
import { fillAlpha, PAPER, STYLE_TOKENS, surfaceBase, type SurfaceKind } from './styles';

export interface LayerOptions {
  /** A surface docked to the screen edge (toolbar, side pane): square, bordered on that edge only, no shadow. */
  edge?: 'bottom' | 'right';
  /** Corner radius override in px (e.g. a drawer rounded on one side). */
  radius?: string | number;
}

/** Glass specular sheen; follows the pointer through --glass-x/--glass-y (see useGlassHighlight). */
function sheen(mode: 'light' | 'dark'): string {
  return `radial-gradient(480px circle at var(--glass-x, 20%) var(--glass-y, 0%), ${alpha('#ffffff', mode === 'dark' ? 0.1 : 0.35)}, transparent 65%)`;
}

const px = (v: string | number) => (typeof v === 'number' ? `${v}px` : v);

/** Full surface CSS for a style: fill, backdrop, border, radius, shadow (always all of them, so nothing leaks from MuiPaper). */
export function layerCss(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme, opts: LayerOptions = {}): CSSObject {
  const tokens = STYLE_TOKENS[style];
  const layer = tokens[kind];
  const blur = layer.lensBlurPx === undefined ? `${layer.blurPx}px` : `var(--glass-lens-blur, ${layer.blurPx}px)`;
  const backdrop = layer.blurPx > 0 ? `${layer.lens ? 'var(--lens,) ' : ''}blur(${blur}) saturate(${layer.saturate})` : 'none';
  const line = {
    none: 'none',
    hairline: `1px solid ${alpha(r.ink, 0.2)}`,
    highlight: `1px solid ${alpha(r.ink, 0.18)}`,
    heavy: `2px solid ${r.ink}`,
  }[tokens.border];
  const shadow = opts.edge ? 'none' : {
    material: 'none',
    none: 'none',
    soft: `0 8px 32px rgba(0, 0, 0, 0.18), inset 1px 1px 0 ${alpha('#ffffff', 0.35)}`,
    hard: `4px 4px 0 ${r.ink}`,
  }[tokens.shadow];
  const css: CSSObject = {
    backgroundColor: alpha(surfaceBase(style, kind, r), fillAlpha(style, kind, r)),
    // MUI derives some surfaces' text colour from their default background (SnackbarContent); ours changed.
    color: r.ink,
    backgroundImage: style === 'glass' ? sheen(r.mode) : 'none',
    backgroundAttachment: style === 'glass' ? 'fixed' : undefined,
    backdropFilter: backdrop,
    WebkitBackdropFilter: backdrop,
    // Always a px string: sx would multiply a bare number by shape.borderRadius.
    borderRadius: opts.edge ? 0 : px(opts.radius ?? tokens.radius),
    boxShadow: shadow,
    border: opts.edge ? 'none' : line,
  };
  if (opts.edge === 'bottom') css.borderBottom = line === 'none' ? `1px solid ${alpha(r.ink, 0.12)}` : line;
  if (opts.edge === 'right') css.borderRight = line === 'none' ? `1px solid ${alpha(r.ink, 0.12)}` : line;
  if (style === 'glass') {
    css['@media (prefers-reduced-transparency: reduce)'] = {
      backgroundColor: surfaceBase(style, kind, r), backgroundImage: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none',
    };
  }
  return css;
}

/** Surface styling for hand-built panes (sx). Material keeps today's frosted values exactly. */
export function surfaceSx(kind: SurfaceKind, opts: LayerOptions & { materialAlpha?: number } = {}): (theme: Theme) => CSSObject {
  return theme => {
    if (theme.uiStyle === 'material') {
      return { backgroundColor: alpha(theme.palette.background.paper, opts.materialAlpha ?? 0.6), backdropFilter: 'blur(14px)' };
    }
    return layerCss(theme.uiStyle, kind, theme.resolved, opts);
  };
}

/**
 * Glass on phones: each content section (stats table, graph, times grid) gets its own frosted card, since the
 * phone panes otherwise sit straight on the background photo. Desktop content already sits on a frosted pane.
 * A few large cards rather than one per time tile keeps scrolling cheap.
 */
export function phoneCardSx(padding: number | string = 0): (theme: Theme) => CSSObject {
  // px strings: sx reads bare numbers for margin/padding as theme spacing units (8 → 64px).
  return theme => (theme.uiStyle === 'glass' ? { ...layerCss('glass', 'content', theme.resolved), margin: '8px', padding: px(padding) } : {});
}

/**
 * Glass time tiles: the theme colour blended into the paper, mostly solid so tiles look alike whatever part of
 * the photo is behind them while it still shows through; a thin faint edge, a soft shadow and no per-tile blur.
 */
export function tileDepthSx(theme: Theme): CSSObject {
  if (theme.uiStyle !== 'glass') return {};
  const r = theme.resolved;
  return {
    // 70% lets the photo show through; it is the lowest that keeps text readable on every palette over pure black/white.
    backgroundColor: alpha(mix(PAPER[r.mode], r.primary, r.mode === 'dark' ? 0.35 : 0.3), 0.7),
    // One thin, faint line all round (no inner top highlight, which made the top edge look thicker).
    border: `1px solid ${alpha(lighten(r.primary, 0.4), 0.22)}`,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
  };
}
