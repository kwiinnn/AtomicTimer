import TextField from '@mui/material/TextField';
import { useState, type FormEvent } from 'react';
import type { Penalty } from '../../core/model';
import { parseTimeInput } from '../../core/time';
import { t } from '../i18n';

export function ManualEntry({ onSubmit }: { onSubmit: (timeMs: number, penalty: Penalty) => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseTimeInput(text);
    if (!parsed) {
      setError(true);
      return;
    }
    onSubmit(parsed.timeMs, parsed.penalty);
    setText('');
    setError(false);
  };
  return (
    <form onSubmit={submit} data-no-timer style={{ width: 'min(100%, 420px)' }}>
      <TextField fullWidth autoFocus label={t('manual.label')} value={text} error={error}
        helperText={error ? t('manual.invalid') : t('manual.help')}
        onChange={e => { setText(e.target.value); setError(false); }}
        slotProps={{ htmlInput: { inputMode: 'decimal', autoComplete: 'off', 'data-testid': 'manual-entry',
          style: { fontSize: '2rem', textAlign: 'center' } } }} />
    </form>
  );
}
