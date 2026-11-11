import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useRef } from 'react';
import { PUZZLES } from '../../core/model';
import { t } from '../i18n';
import { PuzzlePicker } from '../sessions/PuzzlePicker';
import { SessionMenu } from '../sessions/SessionPicker';
import { useApp, useTimerBusy } from '../state/AppContext';

export function TopBar({ onMenu, showTitle }: { onMenu: () => void; showTitle: boolean }) {
  const { session, openPuzzlePicker, openSessionPicker } = useApp();
  const timerBusy = useTimerBusy();
  const sessionAnchor = useRef<HTMLButtonElement>(null);
  if (!session) return null;
  return (
    <Toolbar sx={{ gap: 0.5 }}>
      <IconButton color="inherit" edge="start" aria-label={t('nav.open')} onClick={onMenu}>
        <MenuIcon />
      </IconButton>
      {showTitle && (
        <Typography variant="h6" component="h1" sx={{ mr: 2, fontWeight: 700 }}>
          {t('appName')}
        </Typography>
      )}
      <Button color="inherit" data-testid="puzzle-picker" endIcon={<ArrowDropDown />} onClick={openPuzzlePicker}
        disabled={timerBusy} sx={{ textTransform: 'none', fontSize: '1.05rem', fontWeight: 700 }}>
        {PUZZLES[session.puzzle].label}
      </Button>
      <Button color="inherit" data-testid="session-picker" ref={sessionAnchor} endIcon={<ArrowDropDown />}
        onClick={openSessionPicker} disabled={timerBusy}
        sx={{ textTransform: 'none', minWidth: 0, maxWidth: { xs: 140, sm: 260 } }}>
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.name}</Box>
      </Button>
      <SessionMenu anchor={sessionAnchor} />
      <PuzzlePicker />
    </Toolbar>
  );
}
