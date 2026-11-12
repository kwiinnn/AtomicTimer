/**
 * Which build files the service worker precaches. Optional fonts (and every legacy .woff) are skipped:
 * there are hundreds of subset files, so they are cached at runtime the first time a font is used instead.
 */
export function keepInPrecache(url: string): boolean {
  if (url.endsWith('.woff')) return false;
  if (url.endsWith('.woff2')) return /quicksand-/i.test(url);
  return true;
}
