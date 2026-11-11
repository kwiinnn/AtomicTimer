import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useState } from 'react';
import { useUndo } from '../components/UndoSnackbar';
import type { Penalty, Solve } from '../../core/model';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { CommentDialog } from '../times/CommentDialog';

export function useSolveActions() {
  const { storage } = useApp();
  return {
    togglePenalty: (s: Solve, p: Exclude<Penalty, 'none'>) => storage.putSolve({ ...s, penalty: s.penalty === p ? 'none' : p }),
    remove: (s: Solve) => storage.deleteSolve(s.id),
  };
}

/** Shown under the time right after a solve: DNF, +2, comment, delete. Acts on `solve`. */
export function QuickActions({ solve, onDeleted }: { solve: Solve; onDeleted?: (s: Solve) => void }) {
  const { togglePenalty, remove } = useSolveActions();
  const { storage } = useApp();
  const { showUndo } = useUndo();
  const [commenting, setCommenting] = useState(false);
  return (
    <Box data-no-timer className="hide-while-timing" sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button data-testid="quick-dnf" size="small" variant={solve.penalty === 'dnf' ? 'contained' : 'outlined'}
        onClick={() => togglePenalty(solve, 'dnf')}>{t('quick.dnf')}</Button>
      <Button data-testid="quick-plus2" size="small" variant={solve.penalty === 'plus2' ? 'contained' : 'outlined'}
        onClick={() => togglePenalty(solve, 'plus2')}>{t('quick.plus2')}</Button>
      <Tooltip title={t('quick.comment')}>
        <IconButton data-testid="quick-comment" aria-label={t('quick.comment')} onClick={() => setCommenting(true)}
          color={solve.comment ? 'primary' : 'default'}>
          <ChatBubbleOutline />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('quick.delete')}>
        <IconButton data-testid="quick-delete" aria-label={t('quick.delete')}
          onClick={async () => {
            const removed = await remove(solve);
            if (!removed) return;
            onDeleted?.(removed);
            showUndo(t('undo.solveDeleted'), () => storage.putSolve(removed));
          }}>
          <DeleteOutlined />
        </IconButton>
      </Tooltip>
      {commenting && <CommentDialog solve={solve} onClose={() => setCommenting(false)} />}
    </Box>
  );
}
