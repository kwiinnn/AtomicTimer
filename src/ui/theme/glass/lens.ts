/**
 * Liquid Glass lensing: an SVG displacement filter used as `backdrop-filter: url(#…)`.
 * Only Chromium renders SVG filters in backdrop-filter; everyone else keeps the frosted glass.
 */

/** Width of the bending band along the edge, and how far it bends (px). Subtle by design. */
export const LENS_EDGE = 18;
export const LENS_SCALE = 16;

/** Chromium engine (Chrome, Edge, Android WebView) — not iOS, where every browser is WebKit. */
export function supportsLens(
  ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  brands: { brand: string }[] | undefined = typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands,
): boolean {
  if (brands?.some(b => b.brand === 'Chromium')) return true;
  if (/\b(iPhone|iPad|iPod)\b|CriOS|FxiOS|EdgiOS/.test(ua)) return false;
  return /\bChrome\/\d+/.test(ua);
}

/** Round up to a multiple of 16 px, so similar sizes share one displacement map. */
export function bucket(px: number): number {
  return Math.max(16, Math.ceil(px / 16) * 16);
}

export interface Lens { id: string; mapKey: string; w: number; h: number }

/** One filter per exact size (its region must match the element); the map image is shared per size bucket and stretched. */
export function lensFor(w: number, h: number, radius: number): Lens {
  const [rw, rh] = [Math.round(w), Math.round(h)];
  const r = Math.round(Math.min(radius, rw / 2, rh / 2));
  return { id: `lens-${rw}x${rh}r${r}`, mapKey: `${bucket(rw)}x${bucket(rh)}r${r}`, w: rw, h: rh };
}

const maps = new Map<string, string>();

/** Displacement map for a rounded rect: neutral grey inside, bending inward within LENS_EDGE of the edge. */
export function lensMap(mapKey: string): string {
  const cached = maps.get(mapKey);
  if (cached !== undefined) return cached;
  if (typeof document === 'undefined') return '';
  const [, sw, sh, sr] = /^(\d+)x(\d+)r(\d+)$/.exec(mapKey)!;
  const [w, h, r] = [Number(sw), Number(sh), Number(sr)];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [lx, ly] = [x + 0.5, y + 0.5];
      const [dx, dy] = [Math.min(lx, w - lx), Math.min(ly, h - ly)];
      // Inward directions.
      const [sx, sy] = [lx < w / 2 ? 1 : -1, ly < h / 2 ? 1 : -1];
      let d: number, nx = 0, ny = 0;
      if (dx < r && dy < r) {
        const [cx, cy] = [r - dx, r - dy];
        const l = Math.hypot(cx, cy) || 1;
        d = r - l;
        [nx, ny] = [(sx * cx) / l, (sy * cy) / l];
      } else if (dx < dy) {
        [d, nx] = [dx, sx];
      } else {
        [d, ny] = [dy, sy];
      }
      const m = Math.min(1, Math.max(0, 1 - d / LENS_EDGE) ** 2);
      const i = (y * w + x) * 4;
      // Sample from further inside, so the edge magnifies what's behind it.
      img.data[i] = 128 + nx * m * 127;
      img.data[i + 1] = 128 + ny * m * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL();
  maps.set(mapKey, url);
  return url;
}
