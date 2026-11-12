import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import type { Solve } from '../../core/model';
import { formatSolve } from '../../core/time';
import { ScrambleImage } from '../components/ScrambleImage';
import { useUndo } from '../components/UndoSnackbar';
import { t } from '../i18n';
import { DESKTOP_QUERY } from '../layout/Shell';
import { useApp } from '../state/AppContext';
import { useSolveActions } from '../timer/QuickActions';
import { CommentDialog } from './CommentDialog';

/** Solve details: bottom sheet on phones, dialog on desktop. */
export function SolveSheet({ solve, onClose }: { solve: Solve; onClose: () => void }) {
  const { session, settings, storage } = useApp();
  const desktop = useMediaQuery(DESKTOP_QUERY, { noSsr: true });
  const { togglePenalty, remove } = useSolveActions();
  const { showUndo } = useUndo();
  const [commenting, setCommenting] = useState(false);

  const body = (
    <Box data-testid="solve-sheet" sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography variant="h3" component="p" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {formatSolve(solve, settings.thousandths)}
        </Typography>
        <Typography color="text.secondary">{new Date(solve.createdAt).toLocaleString()}</Typography>
      </Box>
      {solve.scramble && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 220px' }}>
            <Typography variant="overline" color="text.secondary">{t('sheet.scramble')}</Typography>
            <Typography sx={{ wordSpacing: '0.15em' }}>{solve.scramble}</Typography>
          </Box>
          {session && <ScrambleImage puzzle={session.puzzle} scramble={solve.scramble} height={100} />}
        </Box>
      )}
      {solve.comment && (
        <Box>
          <Typography variant="overline" color="text.secondary">{t('sheet.comment')}</Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{solve.comment}</Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant={solve.penalty === 'plus2' ? 'contained' : 'outlined'} onClick={() => togglePenalty(solve, 'plus2')}>{t('quick.plus2')}</Button>
        <Button variant={solve.penalty === 'dnf' ? 'contained' : 'outlined'} onClick={() => togglePenalty(solve, 'dnf')}>{t('quick.dnf')}</Button>
        <Button onClick={() => setCommenting(true)}>{solve.comment ? t('sheet.editComment') : t('sheet.addComment')}</Button>
        <Button color="error" sx={{ ml: 'auto' }}
          onClick={async () => {
            const removed = await remove(solve);
            onClose();
            if (removed) showUndo(t('undo.solveDeleted'), () => storage.putSolve(removed));
          }}>
          {t('sheet.delete')}
        </Button>
      </Box>
      {commenting && <CommentDialog solve={solve} onClose={() => setCommenting(false)} />}
    </Box>
  );

  return desktop ? (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">{body}</Dialog>
  ) : (
    <Drawer anchor="bottom" open onClose={onClose} slotProps={{ paper: { sx: theme => (theme.uiStyle === 'material' ? { borderTopLeftRadius: 16, borderTopRightRadius: 16 } : {}) } }}>
      {body}
    </Drawer>
  );
}
