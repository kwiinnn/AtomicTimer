import Add from '@mui/icons-material/Add';
import Check from '@mui/icons-material/Check';
import DeleteOutline from '@mui/icons-material/DeleteOutlined';
import Edit from '@mui/icons-material/Edit';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { RefObject } from 'react';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';

/** Sessions of the current puzzle, plus create / rename / delete. Opened by the toolbar button or the S shortcut. */
export function SessionMenu({ anchor }: { anchor: RefObject<HTMLElement | null> }) {
  const { sessions, session, picker, closePicker, selectSession, setSessionDialog } = useApp();
  if (!session) return null;
  const mine = sessions.filter(s => s.puzzle === session.puzzle);
  const act = (fn: () => void) => () => {
    closePicker();
    fn();
  };
  return (
    <Menu anchorEl={anchor.current} open={picker === 'session' && !!anchor.current} onClose={closePicker}>
      {mine.map(s => (
        <MenuItem key={s.id} selected={s.id === session.id} onClick={act(() => selectSession(s.id))}>
          <ListItemIcon>{s.id === session.id ? <Check fontSize="small" /> : null}</ListItemIcon>
          <ListItemText>{s.name}</ListItemText>
        </MenuItem>
      ))}
      <Divider />
      <MenuItem onClick={act(() => setSessionDialog({ kind: 'create', puzzle: session.puzzle }))}>
        <ListItemIcon><Add fontSize="small" /></ListItemIcon>
        <ListItemText>{t('session.new')}</ListItemText>
      </MenuItem>
      <MenuItem onClick={act(() => setSessionDialog({ kind: 'rename' }))}>
        <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
        <ListItemText>{t('session.rename')}</ListItemText>
      </MenuItem>
      <MenuItem onClick={act(() => setSessionDialog({ kind: 'delete' }))}>
        <ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon>
        <ListItemText>{t('session.delete')}</ListItemText>
      </MenuItem>
    </Menu>
  );
}
