import { useEffect } from 'react';

/** Moves the glass sheen with the mouse (desktop only; still on touch and with reduced motion) via --glass-x/--glass-y. */
export function useGlassHighlight(enabled: boolean): void {
  useEffect(() => {
    const pointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!enabled || !pointer || still) return;
    const root = document.documentElement.style;
    let frame = 0;
    let x = 0;
    let y = 0;
    const move = (e: PointerEvent) => {
      [x, y] = [e.clientX, e.clientY];
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.setProperty('--glass-x', `${x}px`);
        root.setProperty('--glass-y', `${y}px`);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(frame);
      root.removeProperty('--glass-x');
      root.removeProperty('--glass-y');
    };
  }, [enabled]);
}
