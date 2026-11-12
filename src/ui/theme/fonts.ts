import type { FontId, TimerFontId } from '../../core/settings';

export interface FontInfo {
  label: string;
  category: 'sans' | 'serif' | 'mono' | 'display';
  /** CSS font-family stack, always ending in a generic fallback. */
  family: string;
  /** Loads the web font on demand (precached for offline by the service worker). */
  load?: () => Promise<unknown>;
}

/** Regular, medium and bold, which is all the UI and the timer use. */
const weights = (...css: Promise<unknown>[]) => () => Promise.all(css);

async function loadDseg() {
  const [{ default: bold }, { default: regular }] = await Promise.all([
    import('dseg/fonts/DSEG7-Classic/DSEG7Classic-Bold.woff2?url'),
    import('dseg/fonts/DSEG7-Classic/DSEG7Classic-Regular.woff2?url'),
  ]);
  const faces = [
    new FontFace('DSEG7 Classic', `url(${bold}) format("woff2")`, { weight: '700' }),
    new FontFace('DSEG7 Classic', `url(${regular}) format("woff2")`, { weight: '400' }),
  ];
  for (const face of faces) document.fonts.add(await face.load());
}

/**
 * The font catalogue. Everything except the system stack is OFL-1.1 (via Fontsource, and DSEG7 by keshikan);
 * each is credited on the About page. Quicksand is bundled with the app; the rest load when first chosen.
 */
export const FONTS: Record<FontId, FontInfo> = {
  quicksand: { label: 'Quicksand', category: 'sans', family: '"Quicksand", system-ui, sans-serif' },
  inter: {
    label: 'Inter', category: 'sans', family: '"Inter", system-ui, sans-serif',
    load: () => weights(import('@fontsource/inter/400.css'), import('@fontsource/inter/500.css'), import('@fontsource/inter/700.css'))(),
  },
  nunito: {
    label: 'Nunito', category: 'sans', family: '"Nunito", system-ui, sans-serif',
    load: () => weights(import('@fontsource/nunito/400.css'), import('@fontsource/nunito/500.css'), import('@fontsource/nunito/700.css'))(),
  },
  poppins: {
    label: 'Poppins', category: 'sans', family: '"Poppins", system-ui, sans-serif',
    load: () => weights(import('@fontsource/poppins/400.css'), import('@fontsource/poppins/500.css'), import('@fontsource/poppins/700.css'))(),
  },
  dmSans: {
    label: 'DM Sans', category: 'sans', family: '"DM Sans", system-ui, sans-serif',
    load: () => weights(import('@fontsource/dm-sans/400.css'), import('@fontsource/dm-sans/500.css'), import('@fontsource/dm-sans/700.css'))(),
  },
  plexSans: {
    label: 'IBM Plex Sans', category: 'sans', family: '"IBM Plex Sans", system-ui, sans-serif',
    load: () => weights(import('@fontsource/ibm-plex-sans/400.css'), import('@fontsource/ibm-plex-sans/500.css'), import('@fontsource/ibm-plex-sans/700.css'))(),
  },
  spaceGrotesk: {
    label: 'Space Grotesk', category: 'sans', family: '"Space Grotesk", system-ui, sans-serif',
    load: () => weights(import('@fontsource/space-grotesk/400.css'), import('@fontsource/space-grotesk/500.css'), import('@fontsource/space-grotesk/700.css'))(),
  },
  sourceSerif: {
    label: 'Source Serif 4', category: 'serif', family: '"Source Serif 4", Georgia, serif',
    load: () => weights(import('@fontsource/source-serif-4/400.css'), import('@fontsource/source-serif-4/500.css'), import('@fontsource/source-serif-4/700.css'))(),
  },
  newsreader: {
    label: 'Newsreader', category: 'serif', family: '"Newsreader", Georgia, serif',
    load: () => weights(import('@fontsource/newsreader/400.css'), import('@fontsource/newsreader/500.css'), import('@fontsource/newsreader/700.css'))(),
  },
  lora: {
    label: 'Lora', category: 'serif', family: '"Lora", Georgia, serif',
    load: () => weights(import('@fontsource/lora/400.css'), import('@fontsource/lora/500.css'), import('@fontsource/lora/700.css'))(),
  },
  plexSerif: {
    label: 'IBM Plex Serif', category: 'serif', family: '"IBM Plex Serif", Georgia, serif',
    load: () => weights(import('@fontsource/ibm-plex-serif/400.css'), import('@fontsource/ibm-plex-serif/500.css'), import('@fontsource/ibm-plex-serif/700.css'))(),
  },
  fraunces: {
    label: 'Fraunces', category: 'serif', family: '"Fraunces", Georgia, serif',
    load: () => weights(import('@fontsource/fraunces/400.css'), import('@fontsource/fraunces/500.css'), import('@fontsource/fraunces/700.css'))(),
  },
  mono: {
    label: 'JetBrains Mono', category: 'mono', family: '"JetBrains Mono", ui-monospace, monospace',
    load: () => weights(import('@fontsource/jetbrains-mono/400.css'), import('@fontsource/jetbrains-mono/500.css'), import('@fontsource/jetbrains-mono/700.css'))(),
  },
  robotoMono: {
    label: 'Roboto Mono', category: 'mono', family: '"Roboto Mono", ui-monospace, monospace',
    load: () => weights(import('@fontsource/roboto-mono/400.css'), import('@fontsource/roboto-mono/500.css'), import('@fontsource/roboto-mono/700.css'))(),
  },
  plexMono: {
    label: 'IBM Plex Mono', category: 'mono', family: '"IBM Plex Mono", ui-monospace, monospace',
    load: () => weights(import('@fontsource/ibm-plex-mono/400.css'), import('@fontsource/ibm-plex-mono/500.css'), import('@fontsource/ibm-plex-mono/700.css'))(),
  },
  digital: {
    label: 'Digital (Orbitron)', category: 'display', family: '"Orbitron", system-ui, sans-serif',
    load: () => weights(import('@fontsource/orbitron/400.css'), import('@fontsource/orbitron/700.css'))(),
  },
  lcd: { label: 'LCD (7-segment)', category: 'display', family: '"DSEG7 Classic", ui-monospace, monospace', load: loadDseg },
  system: { label: 'System', category: 'sans', family: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
};

/** Font stack for the timer: its own choice, or the app font when set to 'app'. */
export function timerFamily(timerFont: TimerFontId, appFont: FontId): string {
  return FONTS[timerFont === 'app' ? appFont : timerFont].family;
}

const loaded = new Set<FontId>();

/** Loads a font once; on failure the stack's fallback is used and the next call retries. */
export function ensureFont(id: TimerFontId | FontId): void {
  if (id === 'app') return;
  const load = FONTS[id].load;
  if (!load || loaded.has(id)) return;
  loaded.add(id);
  load().catch(() => loaded.delete(id));
}
