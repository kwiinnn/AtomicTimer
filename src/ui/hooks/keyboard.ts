/** True when keystrokes on `t` belong to a text field or an open dialog, so timer keys and shortcuts must ignore them. */
export function isTypingTarget(t: EventTarget | null): boolean {
  if (!t || !(t instanceof Element)) return false;
  if (t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"]')) return true;
  return t instanceof HTMLElement && t.isContentEditable === true;
}

/**
 * Keys must not drive the timer or shortcuts when typed into a field or inside an open MUI surface
 * (dialog, drawer, menu, select list, popover). MUI keeps focus inside open surfaces and restores it on
 * close, so checking the event target also lets keys through while a closed surface is still fading out.
 */
export function inputBlocked(t: EventTarget | null): boolean {
  return isTypingTarget(t) || (t instanceof Element && t.closest('.MuiModal-root, .MuiPopover-root') !== null);
}
