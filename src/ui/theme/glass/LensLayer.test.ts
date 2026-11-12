import { expect, test } from 'vitest';
import { shouldResync } from './LensLayer';

const node = (nodeType: number) => ({ nodeType }) as Node;
const rec = (r: Partial<{ type: MutationRecordType; added: Node[]; removed: Node[] }>) =>
  ({ type: r.type ?? 'childList', addedNodes: r.added ?? [], removedNodes: r.removed ?? [] }) as unknown as MutationRecord;

test('text updates (the running timer) never trigger a resync', () => {
  expect(shouldResync([rec({ added: [node(3)], removed: [node(3)] })], false)).toBe(false);
});

test('elements mounting or unmounting trigger a resync', () => {
  expect(shouldResync([rec({ added: [node(1)] })], false)).toBe(true);
  expect(shouldResync([rec({ removed: [node(1)] })], false)).toBe(true);
});

test('while timing, structural changes wait; the timing flag flipping resyncs', () => {
  expect(shouldResync([rec({ added: [node(1)] })], true)).toBe(false);
  expect(shouldResync([rec({ type: 'attributes' })], true)).toBe(true);
});
