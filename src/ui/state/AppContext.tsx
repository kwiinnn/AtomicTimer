import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PuzzleId, Session, Solve } from '../../core/model';
import { DEFAULT_SETTINGS, type Settings } from '../../core/settings';
import type { ScrambleService } from '../../platform/scramble';
import type { AppStorage } from '../../platform/storage/types';
import { t } from '../i18n';

export type View = 'timer' | 'settings' | 'about' | 'io';
export type Picker = 'puzzle' | 'session' | null;
export type SessionDialog = { kind: 'create'; puzzle?: PuzzleId } | { kind: 'rename' } | { kind: 'delete' } | null;

export interface AppState {
  storage: AppStorage;
  scrambles: ScrambleService;
  settings: Settings;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  sessions: Session[];
  session: Session | undefined;
  solves: Solve[];
  selectSession(id: string): void;
  /** Switches to the first session of `puzzle`, creating one if none exists. */
  selectPuzzle(puzzle: PuzzleId): Promise<void>;
  createSession(name: string, puzzle: PuzzleId): Promise<Session>;
  timerBusy: boolean;
  setTimerBusy(b: boolean): void;
  view: View;
  setView(v: View): void;
  picker: Picker;
  openPuzzlePicker(): void;
  openSessionPicker(): void;
  closePicker(): void;
  sessionDialog: SessionDialog;
  setSessionDialog(d: SessionDialog): void;
  themeDialogOpen: boolean;
  setThemeDialogOpen(open: boolean): void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}

const newId = () => crypto.randomUUID();

export function AppProvider({ storage, scrambles, children, fallback }: {
  storage: AppStorage;
  scrambles: ScrambleService;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const stored = useLiveQuery(() => storage.getSettings(), [storage]);
  // Local copy after the first change, so controls update instantly; every write is also persisted.
  const [local, setLocal] = useState<Settings | null>(null);
  const latest = useRef<Settings | null>(null);
  const settings = local ?? stored;
  const sessions = useLiveQuery(() => storage.listSessions(), [storage]);
  const [timerBusy, setTimerBusy] = useState(false);
  const [view, setView] = useState<View>('timer');
  const [picker, setPicker] = useState<Picker>(null);
  const [sessionDialog, setSessionDialog] = useState<SessionDialog>(null);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);

  const s = settings ?? DEFAULT_SETTINGS;
  const session = sessions?.find(x => x.id === s.currentSessionId) ?? sessions?.[0];
  const solves = useLiveQuery(() => (session ? storage.listSolves(session.id) : []), [storage, session?.id]);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const base = latest.current ?? (await storage.getSettings());
      const next = { ...base, ...patch };
      latest.current = next;
      setLocal(next);
      await storage.putSettings(next);
    },
    [storage],
  );

  const createSession = useCallback(
    async (name: string, puzzle: PuzzleId) => {
      const all = await storage.listSessions();
      const created: Session = {
        id: newId(),
        name,
        puzzle,
        order: all.reduce((m, x) => Math.max(m, x.order), -1) + 1,
        createdAt: Date.now(),
      };
      await storage.putSession(created);
      await updateSettings({ currentSessionId: created.id });
      return created;
    },
    [storage, updateSettings],
  );

  // First run (or after deleting the last session): make sure a session exists.
  const bootstrapping = useRef(false);
  useEffect(() => {
    if (!sessions || sessions.length > 0 || bootstrapping.current) return;
    bootstrapping.current = true;
    void createSession(t('session.default'), '333').finally(() => {
      bootstrapping.current = false;
    });
  }, [sessions, createSession]);

  const selectSession = useCallback(
    (id: string) => {
      if (timerBusy) return;
      void updateSettings({ currentSessionId: id });
    },
    [timerBusy, updateSettings],
  );

  const selectPuzzle = useCallback(
    async (puzzle: PuzzleId) => {
      if (timerBusy) return;
      const existing = (await storage.listSessions()).find(x => x.puzzle === puzzle);
      if (existing) await updateSettings({ currentSessionId: existing.id });
      else await createSession(t('session.default'), puzzle);
    },
    [timerBusy, storage, updateSettings, createSession],
  );

  const value = useMemo<AppState>(
    () => ({
      storage,
      scrambles,
      settings: s,
      updateSettings,
      sessions: sessions ?? [],
      session,
      solves: solves ?? [],
      selectSession,
      selectPuzzle,
      createSession,
      timerBusy,
      setTimerBusy,
      view,
      setView,
      picker,
      openPuzzlePicker: () => !timerBusy && setPicker('puzzle'),
      openSessionPicker: () => !timerBusy && setPicker('session'),
      closePicker: () => setPicker(null),
      sessionDialog,
      setSessionDialog,
      themeDialogOpen,
      setThemeDialogOpen,
    }),
    [storage, scrambles, s, updateSettings, sessions, session, solves, selectSession, selectPuzzle, createSession,
      timerBusy, view, picker, sessionDialog, themeDialogOpen],
  );

  if (!settings || !sessions || !session) return <>{fallback ?? null}</>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
