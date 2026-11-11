import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { t } from '../i18n';

interface UndoApi {
  showUndo(message: string, undo: () => Promise<void>): void;
}

const Ctx = createContext<UndoApi | null>(null);

export function useUndo(): UndoApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useUndo must be used inside <UndoProvider>');
  return v;
}

/** One snackbar at a time; a new call replaces the previous offer. */
export function UndoProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{ key: number; message: string; undo: () => Promise<void> } | null>(null);
  const showUndo = useCallback((message: string, undo: () => Promise<void>) => setCurrent({ key: Date.now(), message, undo }), []);
  const api = useMemo(() => ({ showUndo }), [showUndo]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <Snackbar
        key={current?.key}
        open={!!current}
        autoHideDuration={6000}
        onClose={(_, reason) => reason !== 'clickaway' && setCurrent(null)}
        message={current?.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <Button data-testid="undo-button" color="secondary" size="small"
            onClick={() => {
              const undo = current?.undo;
              setCurrent(null);
              void undo?.();
            }}>
            {t('undo.action')}
          </Button>
        }
      />
    </Ctx.Provider>
  );
}
