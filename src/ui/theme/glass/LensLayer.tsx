import { useEffect, useState } from 'react';
import { FLOAT_SELECTOR, STYLE_TOKENS } from '../styles';
import { LENS_SCALE, lensFor, lensMap, supportsLens, type Lens } from './lens';

const sameIds = (a: Map<string, Lens>, b: Map<string, Lens>) => a.size === b.size && [...a.keys()].every(k => b.has(k));
const ELEMENT = 1;

/**
 * Only elements mounting/unmounting can add or remove a floating surface — not text changes, which the
 * running timer makes every frame. While timing (glass filters are off anyway) even those wait; the
 * timing flag flipping back triggers one catch-up resync.
 */
export function shouldResync(records: MutationRecord[], timing: boolean): boolean {
  if (records.some(r => r.type === 'attributes')) return true;
  if (timing) return false;
  const hasElement = (nodes: NodeList | Node[]) => Array.prototype.some.call(nodes, (n: Node) => n.nodeType === ELEMENT);
  return records.some(r => hasElement(r.addedNodes) || hasElement(r.removedNodes));
}

/**
 * Gives every floating surface a lens filter sized to it (Chromium, Liquid Glass only) through `--lens`,
 * which the glass backdrop-filter reads as `var(--lens,)`. Follows surfaces as they mount, unmount and resize.
 */
export function LensLayer({ enabled }: { enabled: boolean }) {
  const [lenses, setLenses] = useState<Map<string, Lens>>(() => new Map());
  useEffect(() => {
    if (!enabled || !supportsLens() || matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    // Heavier blur erases the lens, so bars frost lightly only where the lens renders (12px elsewhere).
    const root = document.documentElement.style;
    root.setProperty('--glass-lens-blur', `${STYLE_TOKENS.glass.float.lensBlurPx}px`);
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
    const mutations = new MutationObserver(records => {
      if (shouldResync(records, document.body.dataset.timing === 'true')) schedule();
    });
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-timing'] });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      for (const el of tracked.keys()) el.style.removeProperty('--lens');
      root.removeProperty('--glass-lens-blur');
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
