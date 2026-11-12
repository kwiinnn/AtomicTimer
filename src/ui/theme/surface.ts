import { alpha, type Theme } from '@mui/material/styles';
import type { CSSObject } from '@mui/material/styles';
import type { UiStyle } from '../../core/settings';
import type { ResolvedTheme } from './resolve';
import { STYLE_TOKENS, surfaceBase, type SurfaceKind } from './styles';

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

/** Full surface CSS for a style: fill, backdrop, border, radius, shadow (always all of them, so nothing leaks from MuiPaper). */
export function layerCss(style: UiStyle, kind: SurfaceKind, r: ResolvedTheme, opts: LayerOptions = {}): CSSObject {
  const tokens = STYLE_TOKENS[style];
  const layer = tokens[kind];
  const backdrop = layer.blurPx > 0 ? `${layer.lens ? 'var(--lens,) ' : ''}blur(${layer.blurPx}px) saturate(${layer.saturate})` : 'none';
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
    backgroundColor: alpha(surfaceBase(style, kind, r), layer.fillAlpha),
    backgroundImage: style === 'glass' ? sheen(r.mode) : 'none',
    backgroundAttachment: style === 'glass' ? 'fixed' : undefined,
    backdropFilter: backdrop,
    WebkitBackdropFilter: backdrop,
    borderRadius: opts.edge ? 0 : (opts.radius ?? tokens.radius),
    boxShadow: shadow,
    border: opts.edge ? 'none' : line,
  };
  if (opts.edge === 'bottom') css.borderBottom = line === 'none' ? `1px solid ${alpha(r.ink, 0.12)}` : line;
  if (opts.edge === 'right') css.borderRight = line === 'none' ? `1px solid ${alpha(r.ink, 0.12)}` : line;
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
