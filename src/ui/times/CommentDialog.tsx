import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useState, type FormEvent } from 'react';
import type { Solve } from '../../core/model';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';

export function CommentDialog({ solve, onClose }: { solve: Solve; onClose: () => void }) {
  const { storage } = useApp();
  const [text, setText] = useState(solve.comment);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await storage.putSolve({ ...solve, comment: text.trim() });
    onClose();
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>{t('comment.title')}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <TextField autoFocus fullWidth multiline minRows={2} label={t('comment.label')} value={text} onChange={e => setText(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="contained">{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}
