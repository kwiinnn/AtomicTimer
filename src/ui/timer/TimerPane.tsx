import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Penalty, Solve } from '../../core/model';
import { formatSolve, formatTime } from '../../core/time';
import { INSPECTION, type TimerState } from '../../core/timer/machine';
import { setKeepAwake } from '../../platform/device';
import { ScrambleImage } from '../components/ScrambleImage';
import { ShortcutOverlay } from '../components/ShortcutOverlay';
import { useUndo } from '../components/UndoSnackbar';
import { useShortcuts } from '../hooks/shortcuts';
import { CommentDialog } from '../times/CommentDialog';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { playInspectionAlert } from './alerts';
import { ManualEntry } from './ManualEntry';
import { QuickActions, useSolveActions } from './QuickActions';
import { ScrambleBox } from './ScrambleBox';
import { createSolveRecorder, SaveError } from './solveRecorder';
import { shortcutTarget } from './lastSolve';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { TimerDisplay } from './TimerDisplay';
import { useTimer } from './useTimer';

const BUSY = new Set<TimerState['kind']>(['inspecting', 'holding', 'ready', 'running']);
const HIDE_UI = new Set<TimerState['kind']>(['inspecting', 'running']);

const newId = () => crypto.randomUUID();
const now = () => Date.now();

function inspectionText(startedAt: number, now: number): string {
  const remaining = INSPECTION.plus2AfterMs - (now - startedAt);
  if (remaining > 0) return String(Math.ceil(remaining / 1000));
  return now - startedAt <= INSPECTION.dnfAfterMs ? '+2' : 'DNF';
}

export function TimerPane({ onSolveDeleted }: { onSolveDeleted?: (s: Solve) => void }) {
  const { session, settings, storage, scrambles, solves, setTimerBusy, timerBusy, openPuzzlePicker, openSessionPicker } = useApp();
  const recorder = useMemo(
    () => createSolveRecorder({ scrambles, save: s => storage.putSolve(s), newId, now }),
    [scrambles, storage],
  );
  const scramble = useSyncExternalStore(recorder.subscribe, recorder.current);
  const scrambleError = useSyncExternalStore(recorder.subscribe, recorder.error);
  const puzzle = session!.puzzle;
  const sessionId = session!.id;
  useEffect(() => {
    void recorder.load(puzzle);
  }, [recorder, puzzle]);

  // The most recent solve made in this view: quick actions and the resting display refer to it.
  // Tagged with its session so switching sessions hides it without resetting state in an effect.
  type LastRec = { sessionId: string; id: string | null; result: { timeMs: number; penalty: Penalty } };
  const [lastRec, setLastRec] = useState<LastRec | null>(null);
  const mine = lastRec?.sessionId === sessionId ? lastRec : null;
  const lastResult = mine?.result ?? null;
  const last = mine?.id ? (solves.find(s => s.id === mine.id) ?? null) : null;

  const display = useRef<HTMLDivElement>(null);
  const paint = (text: string) => {
    if (display.current && display.current.textContent !== text) display.current.textContent = text;
  };

  const [unsaved, setUnsaved] = useState<{ solve: Solve; retry: () => Promise<void> } | null>(null);
  const record = useCallback(
    (timeMs: number, penalty: Penalty, source: Solve['source']) => {
      const result = { timeMs, penalty };
      setLastRec({ sessionId, id: null, result });
      const attach = (s: Solve) => setLastRec(r => (r?.result === result ? { ...r, id: s.id } : r));
      recorder.onFinished(sessionId, timeMs, penalty, source).then(attach, (e: unknown) => {
        // Keep the unsaved solve in memory and offer a retry instead of losing it silently.
        if (e instanceof SaveError) setUnsaved({ solve: e.solve, retry: () => storage.putSolve(e.solve).then(() => attach(e.solve)) });
      });
    },
    [recorder, sessionId, storage],
  );

  const { state, pointerHandlers } = useTimer(
    { holdMs: settings.holdMs, inspection: settings.inspection },
    {
      onStarted: () => {
        recorder.onStarted();
        setLastRec(null);
        void setKeepAwake(true);
      },
      onFinished: (timeMs, penalty, input) => {
        void setKeepAwake(false);
        record(timeMs, penalty, input);
      },
      onCancelled: () => void setKeepAwake(false),
      onAlert: second => {
        if (settings.inspectionAlerts) playInspectionAlert(second, { sound: true });
      },
      onFrame: (st, now) => {
        if (st.kind === 'running') paint(formatTime(now - st.startedAt, settings.thousandths));
        else if ((st.kind === 'inspecting' || st.kind === 'holding' || st.kind === 'ready') && st.insp) {
          paint(inspectionText(st.insp.startedAt, now));
        }
      },
    },
    !settings.manualEntry,
  );

  // Resting text (idle / stopped / hold without inspection).
  useLayoutEffect(() => {
    if (state.kind === 'running' || ((state.kind === 'holding' || state.kind === 'ready' || state.kind === 'inspecting') && state.insp)) return;
    if (state.kind === 'stopped') paint(formatSolve(state, settings.thousandths));
    else if (state.kind === 'holding' || state.kind === 'ready') paint(formatTime(0, settings.thousandths));
    else paint(last ? formatSolve(last, settings.thousandths) : lastResult ? formatSolve(lastResult, settings.thousandths) : formatTime(0, settings.thousandths));
  });

  useEffect(() => setTimerBusy(BUSY.has(state.kind)), [state.kind, setTimerBusy]);
  useEffect(() => {
    document.body.dataset.timing = String(HIDE_UI.has(state.kind));
    return () => {
      delete document.body.dataset.timing;
    };
  }, [state.kind]);

  const [enlarged, setEnlarged] = useState(false);
  const [help, setHelp] = useState(false);
  const [commentFor, setCommentFor] = useState<Solve | null>(null);
  const { togglePenalty, remove } = useSolveActions();
  const { showUndo } = useUndo();
  const newest = shortcutTarget(solves, mine);
  useShortcuts(
    {
      plus2: () => newest && void togglePenalty(newest, 'plus2'),
      dnf: () => newest && void togglePenalty(newest, 'dnf'),
      comment: () => newest && setCommentFor(newest),
      deleteLast: async () => {
        if (!newest) return;
        const removed = await remove(newest);
        if (!removed) return;
        setLastRec(null);
        showUndo(t('undo.solveDeleted'), () => storage.putSolve(removed));
      },
      nextScramble: () => void recorder.load(puzzle),
      puzzlePicker: openPuzzlePicker,
      sessionPicker: openSessionPicker,
      help: () => setHelp(true),
    },
    BUSY.has(state.kind),
  );

  return (
    <Box
      data-testid="timer-pane"
      data-solve-count={solves.length}
      {...pointerHandlers}
      onContextMenu={e => e.preventDefault()}
      sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', touchAction: 'pan-x', userSelect: 'none',
        WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      <ScrambleBox scramble={scramble} error={scrambleError} scale={settings.scrambleTextScale} disabled={timerBusy}
        onNext={() => void recorder.load(puzzle)} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, px: 2 }}>
        {settings.manualEntry ? (
          <ManualEntry onSubmit={(timeMs, penalty) => record(timeMs, penalty, 'manual')} />
        ) : (
          <TimerDisplay ref={display} kind={state.kind} inspecting={settings.inspection} scale={settings.timerTextScale} />
        )}
        <Box sx={{ minHeight: 48 }}>
          {last && !BUSY.has(state.kind) && (
            <QuickActions solve={last} onDeleted={s => {
              setLastRec(null);
              onSolveDeleted?.(s);
            }} />
          )}
        </Box>
      </Box>
      <Box className="hide-while-timing" data-no-timer sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        {scramble && <ScrambleImage puzzle={puzzle} scramble={scramble} height={110} onClick={() => setEnlarged(true)} />}
      </Box>
      <Snackbar open={!!unsaved} message={t('save.failed')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        action={<Button color="secondary" size="small" onClick={() => {
          const u = unsaved;
          if (!u) return;
          void u.retry().then(() => { setUnsaved(null); void recorder.load(puzzle); }, () => {});
        }}>{t('save.retry')}</Button>} />
      <ShortcutOverlay open={help} onClose={() => setHelp(false)} />
      {commentFor && <CommentDialog solve={commentFor} onClose={() => setCommentFor(null)} />}
      <Dialog open={enlarged && !!scramble} onClose={() => setEnlarged(false)} fullWidth maxWidth="sm">
        <DialogTitle>{t('scramble.enlarge')}</DialogTitle>
        <DialogContent>
          {scramble && <ScrambleImage puzzle={puzzle} scramble={scramble} height="auto" />}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
