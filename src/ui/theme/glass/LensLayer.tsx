import { useEffect, useState } from 'react';
import { FLOAT_SELECTOR } from '../styles';
import { LENS_SCALE, lensFor, lensMap, supportsLens, type Lens } from './lens';

const sameIds = (a: Map<string, Lens>, b: Map<string, Lens>) => a.size === b.size && [...a.keys()].every(k => b.has(k));

/**
 * Gives every floating surface a lens filter sized to it (Chromium, Liquid Glass only) through `--lens`,
 * which the glass backdrop-filter reads as `var(--lens,)`. Follows surfaces as they mount, unmount and resize.
 */
export function LensLayer({ enabled }: { enabled: boolean }) {
  const [lenses, setLenses] = useState<Map<string, Lens>>(() => new Map());
  useEffect(() => {
    if (!enabled || !supportsLens() || matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    const tracked = new Map<HTMLElement, string>();
    let frame = 0;
    const sync = () => {
      frame = 0;
      const next = new Map<string, Lens>();
      document.querySelectorAll<HTMLElement>(FLOAT_SELECTOR).forEach(el => {
        if (!tracked.has(el)) {
          resize.observe(el);
          tracked.set(el, '');
        }
        if (!el.offsetWidth || !el.offsetHeight) return;
        const lens = lensFor(el.offsetWidth, el.offsetHeight, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
        next.set(lens.id, lens);
        if (tracked.get(el) !== lens.id) {
          el.style.setProperty('--lens', `url(#${lens.id})`);
          tracked.set(el, lens.id);
        }
      });
      for (const el of [...tracked.keys()]) {
        if (!el.isConnected) {
          resize.unobserve(el);
          tracked.delete(el);
        }
      }
      setLenses(prev => (sameIds(prev, next) ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    const resize = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      for (const el of tracked.keys()) el.style.removeProperty('--lens');
      setLenses(new Map());
    };
  }, [enabled]);

  if (lenses.size === 0) return null;
  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {[...lenses.values()].map(l => (
          <filter key={l.id} id={l.id} x="0" y="0" width={l.w} height={l.h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={lensMap(l.mapKey)} x="0" y="0" width={l.w} height={l.h} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={LENS_SCALE} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
