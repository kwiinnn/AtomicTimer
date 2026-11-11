import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { t } from '../i18n';
import { useTimerBusy } from '../state/AppContext';

/** Offers a reload when a new version is installed — but never while a solve is in progress. */
export function UpdatePrompt() {
  const timerBusy = useTimerBusy();
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  return (
    <Snackbar open={needRefresh && !timerBusy} message={t('update.available')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      action={<Button color="secondary" size="small" onClick={() => void updateServiceWorker(true)}>{t('update.reload')}</Button>} />
  );
}
