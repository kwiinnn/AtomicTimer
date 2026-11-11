import { useEffect, useRef } from 'react';
import { isTypingTarget } from './keyboard';

export type ShortcutAction = 'plus2' | 'dnf' | 'comment' | 'deleteLast' | 'nextScramble' | 'puzzlePicker' | 'sessionPicker' | 'help';

const KEYS: Record<string, ShortcutAction> = {
  '2': 'plus2', d: 'dnf', c: 'comment', delete: 'deleteLast', n: 'nextScramble', arrowright: 'nextScramble',
  p: 'puzzlePicker', s: 'sessionPicker', '?': 'help',
};

export interface ShortcutInput {
  key: string;
  repeat: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  target: EventTarget | null;
}

export function keyToShortcut(e: ShortcutInput, timerBusy: boolean): ShortcutAction | null {
  if (timerBusy || e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return null;
  return KEYS[e.key.toLowerCase()] ?? null;
}

/** Listens on window and dispatches shortcut actions to `handlers`. */
export function useShortcuts(handlers: Record<ShortcutAction, () => void>, timerBusy: boolean, enabled = true) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const action = keyToShortcut(e, timerBusy);
      if (!action) return;
      e.preventDefault();
      ref.current[action]();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [timerBusy, enabled]);
}

/** Rows for the help overlay (spec §9). */
export const SHORTCUT_HELP: [string, string][] = [
  ['Space', 'Hold to get ready, release to start; any key stops'],
  ['Esc', 'Cancel solve or inspection'],
  ['2', 'Toggle +2 on the last solve'],
  ['D', 'Toggle DNF on the last solve'],
  ['C', 'Comment on the last solve'],
  ['Delete', 'Delete the last solve (undo available)'],
  ['N or →', 'Next scramble'],
  ['P', 'Choose puzzle'],
  ['S', 'Choose session'],
  ['?', 'Show this help'],
];
