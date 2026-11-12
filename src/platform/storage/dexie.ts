import Dexie, { type EntityTable } from 'dexie';
import type { Session, Solve } from '../../core/model';
import { migrateSettings, type Settings } from '../../core/settings';
import type { AppStorage, AssetKey } from './types';

type SettingsRow = { key: 'app'; value: unknown };
type AssetRow = { key: AssetKey; blob: Blob };

class AtomicDb extends Dexie {
  sessions!: EntityTable<Session, 'id'>;
  solves!: EntityTable<Solve, 'id'>;
  settings!: EntityTable<SettingsRow, 'key'>;
  assets!: EntityTable<AssetRow, 'key'>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      sessions: 'id, order',
      solves: 'id, sessionId, [sessionId+createdAt]',
      settings: 'key',
    });
    // v2: user assets (background image). Existing data is untouched.
    this.version(2).stores({ assets: 'key' });
  }
}

export function createDexieStorage(dbName = 'atomic-timer'): AppStorage {
  const db = new AtomicDb(dbName);
  return {
    listSessions: () => db.sessions.orderBy('order').toArray(),
    putSession: async s => {
      await db.sessions.put(s);
    },
    deleteSession: id =>
      db.transaction('rw', db.sessions, db.solves, async () => {
        await db.solves.where('sessionId').equals(id).delete();
        await db.sessions.delete(id);
      }),
    listSolves: sessionId =>
      db.solves.where('[sessionId+createdAt]').between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey]).toArray(),
    putSolve: async s => {
      await db.solves.put(s);
    },
    deleteSolve: id =>
      db.transaction('rw', db.solves, async () => {
        const s = await db.solves.get(id);
        if (s) await db.solves.delete(id);
        return s;
      }),
    bulkImport: (sessions, solves) =>
      db.transaction('rw', db.sessions, db.solves, async () => {
        await db.sessions.bulkAdd(sessions);
        await db.solves.bulkAdd(solves);
      }),
    getSettings: async () => migrateSettings((await db.settings.get('app'))?.value),
    putSettings: async (s: Settings) => {
      await db.settings.put({ key: 'app', value: s });
    },
    exportAll: () =>
      db.transaction('r', db.sessions, db.solves, db.settings, async () => ({
        sessions: await db.sessions.orderBy('order').toArray(),
        solves: await db.solves.orderBy('[sessionId+createdAt]').toArray(),
        settings: migrateSettings((await db.settings.get('app'))?.value),
      })),
    getAsset: async key => (await db.assets.get(key))?.blob,
    putAsset: async (key, blob) => {
      if (blob) await db.assets.put({ key, blob });
      else await db.assets.delete(key);
    },
  };
}

/** Asks the browser not to evict our data under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
