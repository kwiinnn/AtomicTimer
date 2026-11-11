import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { useEffect, useRef, useState } from 'react';
import { requestPersistence } from '../../platform/storage/dexie';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/** Once per app start: ask for persistent storage and, if due, nudge the user to export a backup. */
export function BackupReminder() {
  const { storage, settings, setView } = useApp();
  const [open, setOpen] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    void requestPersistence();
    if (!settings.backupReminder) return;
    const due = settings.lastBackupAt === null || Date.now() - settings.lastBackupAt > THIRTY_DAYS;
    if (!due) return;
    void storage.exportAll().then(d => d.solves.length > 0 && setOpen(true));
  }, [settings.backupReminder, settings.lastBackupAt, storage]);

  return (
    <Snackbar open={open} onClose={(_, reason) => reason !== 'clickaway' && setOpen(false)} autoHideDuration={10_000}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }} message={t('backup.reminder')}
      action={<Button color="secondary" size="small" onClick={() => { setOpen(false); setView('io'); }}>{t('backup.action')}</Button>} />
  );
}
