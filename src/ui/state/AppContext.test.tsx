// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { DEFAULT_SETTINGS } from '../../core/settings';
import type { ScrambleService } from '../../platform/scramble';
import { createDexieStorage } from '../../platform/storage/dexie';
import type { AppStorage } from '../../platform/storage/types';
import { AppProvider, useApp } from './AppContext';

/** Real storage whose settings reads become slow once armed, like a busy IndexedDB. */
let slow = false;
async function slowStorage(): Promise<AppStorage> {
  const real = createDexieStorage(`ctx-${Math.random()}`);
  await real.putSession({ id: 's', name: 'Session 1', puzzle: '333', order: 0, createdAt: 0 });
  await real.putSettings({ ...DEFAULT_SETTINGS, currentSessionId: 's' });
  return { ...real, getSettings: () => (slow ? new Promise(r => setTimeout(() => void real.getSettings().then(r), 10_000)) : real.getSettings()) };
}
const scrambles: ScrambleService = { next: async () => 'R U', prefetch: () => {} };

function Probe() {
  const { settings, updateSettings } = useApp();
  return (
    <>
      <span data-testid="hold">{settings.holdMs}</span>
      <button onClick={() => void updateSettings({ holdMs: 0 })}>change</button>
    </>
  );
}

test('a settings change shows immediately, without waiting for a storage read', async () => {
  render(<AppProvider storage={await slowStorage()} scrambles={scrambles}><Probe /></AppProvider>);
  expect((await screen.findByTestId('hold')).textContent).toBe('300');
  slow = true;
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'change' }));
  });
  expect(screen.getByTestId('hold').textContent).toBe('0');
});
