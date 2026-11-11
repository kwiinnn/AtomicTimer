/** True when keystrokes on `t` belong to a text field or an open dialog, so timer keys and shortcuts must ignore them. */
export function isTypingTarget(t: EventTarget | null): boolean {
  if (!t || !(t instanceof Element)) return false;
  if (t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="dialog"]')) return true;
  return t instanceof HTMLElement && t.isContentEditable === true;
}
