import { expect, test } from 'vitest';
import { createScrambleService } from './scramble';

function fakeGen() {
  let n = 0;
  const calls: string[] = [];
  const gen = async (id: string) => {
    calls.push(id);
    return `${id}-${n++}`;
  };
  return { gen, calls };
}

test('first next() resolves to a fresh scramble', async () => {
  const { gen } = fakeGen();
  expect(await createScrambleService(gen).next('333')).toBe('333-0');
});
test('second next() comes from the prefetch started by the first', async () => {
  const { gen, calls } = fakeGen();
  const s = createScrambleService(gen);
  await s.next('333');
  expect(calls).toEqual(['333', '333']);
  expect(await s.next('333')).toBe('333-1');
  expect(calls).toEqual(['333', '333', '333']);
});
test('uses the WCA event id', async () => {
  const { gen, calls } = fakeGen();
  await createScrambleService(gen).next('333oh');
  expect(calls[0]).toBe('333oh');
});
test('prefetch is per puzzle', async () => {
  const { gen } = fakeGen();
  const s = createScrambleService(gen);
  s.prefetch('222');
  expect(await s.next('444')).toMatch(/^444-/);
  expect(await s.next('222')).toMatch(/^222-/);
});
test('a failed generation rejects and the next call retries', async () => {
  let fail = true;
  const s = createScrambleService(async id => {
    if (fail) {
      fail = false;
      throw new Error('worker died');
    }
    return `${id}-ok`;
  });
  await expect(s.next('333')).rejects.toThrow('worker died');
  expect(await s.next('333')).toBe('333-ok');
});
