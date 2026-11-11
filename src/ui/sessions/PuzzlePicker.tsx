import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { PUZZLE_ORDER, PUZZLES } from '../../core/model';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';

export function PuzzlePicker() {
  const { picker, closePicker, session, selectPuzzle } = useApp();
  return (
    <Dialog open={picker === 'puzzle'} onClose={closePicker} fullWidth maxWidth="xs">
      <DialogTitle>{t('puzzle.choose')}</DialogTitle>
      <List role="listbox" aria-label={t('puzzle.choose')} sx={{ pt: 0 }}>
        {PUZZLE_ORDER.map(id => (
          <ListItemButton key={id} role="option" aria-selected={session?.puzzle === id} selected={session?.puzzle === id}
            onClick={() => {
              closePicker();
              void selectPuzzle(id);
            }}>
            <ListItemText primary={PUZZLES[id].label} />
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  );
}
