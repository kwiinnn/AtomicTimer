import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { useState, type FormEvent } from 'react';
import { PUZZLE_ORDER, PUZZLES, type PuzzleId } from '../../core/model';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';

export function SessionDialogs() {
  const { sessionDialog, setSessionDialog } = useApp();
  const close = () => setSessionDialog(null);
  if (!sessionDialog) return null;
  if (sessionDialog.kind === 'create') return <CreateDialog initialPuzzle={sessionDialog.puzzle ?? '333'} onClose={close} />;
  if (sessionDialog.kind === 'rename') return <RenameDialog onClose={close} />;
  return <DeleteDialog onClose={close} />;
}

function CreateDialog({ initialPuzzle, onClose }: { initialPuzzle: PuzzleId; onClose: () => void }) {
  const { createSession } = useApp();
  const [name, setName] = useState('');
  const [puzzle, setPuzzle] = useState<PuzzleId>(initialPuzzle);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createSession(name.trim(), puzzle);
    onClose();
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>{t('session.new')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField autoFocus label={t('session.name')} value={name} onChange={e => setName(e.target.value)} required />
        <FormControl>
          <InputLabel id="new-session-puzzle">{t('session.puzzle')}</InputLabel>
          <Select labelId="new-session-puzzle" label={t('session.puzzle')} value={puzzle} onChange={e => setPuzzle(e.target.value as PuzzleId)}>
            {PUZZLE_ORDER.map(id => <MenuItem key={id} value={id}>{PUZZLES[id].label}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={!name.trim()}>{t('common.create')}</Button>
      </DialogActions>
    </Dialog>
  );
}

function RenameDialog({ onClose }: { onClose: () => void }) {
  const { session, storage } = useApp();
  const [name, setName] = useState(session?.name ?? '');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !name.trim()) return;
    await storage.putSession({ ...session, name: name.trim() });
    onClose();
  };
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={submit}>
      <DialogTitle>{t('session.rename')}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <TextField autoFocus fullWidth label={t('session.name')} value={name} onChange={e => setName(e.target.value)} required />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={!name.trim()}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ onClose }: { onClose: () => void }) {
  const { session, solves, storage, sessions, updateSettings } = useApp();
  if (!session) return null;
  const confirm = async () => {
    const next = sessions.find(s => s.id !== session.id && s.puzzle === session.puzzle) ?? sessions.find(s => s.id !== session.id);
    await updateSettings({ currentSessionId: next?.id ?? null });
    await storage.deleteSession(session.id);
    onClose();
  };
  return (
    <Dialog open onClose={onClose} maxWidth="xs">
      <DialogTitle>{t('session.delete')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('session.deleteConfirm', { name: session.name, count: solves.length })}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button color="error" variant="contained" onClick={confirm}>{t('common.delete')}</Button>
      </DialogActions>
    </Dialog>
  );
}
