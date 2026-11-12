import type { TimerFontId } from '../../core/settings';

export interface TimerFont {
  label: string;
  /** CSS font-family stack, always ending in a generic fallback. */
  family: string;
  /** Loads the web font on demand (cached for offline by the service worker). */
  load?: () => Promise<unknown>;
}

async function loadDseg() {
  const [{ default: bold }, { default: regular }] = await Promise.all([
    import('dseg/fonts/DSEG7-Classic/DSEG7Classic-Bold.woff2?url'),
    import('dseg/fonts/DSEG7-Classic/DSEG7Classic-Regular.woff2?url'),
  ]);
  const faces = [new FontFace('DSEG7 Classic', `url(${bold}) format("woff2")`, { weight: '700' }),
    new FontFace('DSEG7 Classic', `url(${regular}) format("woff2")`, { weight: '400' })];
  for (const face of faces) document.fonts.add(await face.load());
}

/** All fonts are OFL-1.1: Quicksand, JetBrains Mono, Orbitron (Fontsource) and DSEG7 (Keshikan). */
export const TIMER_FONTS: Record<TimerFontId, TimerFont> = {
  quicksand: { label: 'Quicksand', family: '"Quicksand", system-ui, sans-serif' },
  mono: { label: 'Mono', family: '"JetBrains Mono", ui-monospace, monospace', load: () => import('@fontsource/jetbrains-mono/700.css') },
  digital: { label: 'Digital', family: '"Orbitron", system-ui, sans-serif', load: () => import('@fontsource/orbitron/700.css') },
  lcd: { label: 'LCD (7-segment)', family: '"DSEG7 Classic", ui-monospace, monospace', load: loadDseg },
  system: { label: 'System', family: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
};

const loaded = new Set<TimerFontId>();

/** Loads a timer font once; failures fall back to the stack's generic font. */
export function ensureTimerFont(id: TimerFontId): void {
  const load = TIMER_FONTS[id].load;
  if (!load || loaded.has(id)) return;
  loaded.add(id);
  load().catch(() => loaded.delete(id));
}
