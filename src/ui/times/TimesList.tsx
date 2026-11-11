import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemo, useState } from 'react';
import { formatSolve } from '../../core/time';
import { t } from '../i18n';
import { DESKTOP_QUERY } from '../layout/Shell';
import { useApp } from '../state/AppContext';
import { SolveSheet } from './SolveSheet';

export function TimesList() {
  const { solves, settings } = useApp();
  const desktop = useMediaQuery(DESKTOP_QUERY, { noSsr: true });
  const [openId, setOpenId] = useState<string | null>(null);
  const newestFirst = useMemo(() => [...solves].reverse(), [solves]);
  const open = openId ? solves.find(s => s.id === openId) : undefined;

  return (
    <Box data-testid="times-list" aria-label={t('times.label')} sx={{ p: 1, minHeight: '100%' }}>
      {newestFirst.length === 0 && (
        <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>{t('times.empty')}</Typography>
      )}
      <Box sx={{ display: 'grid', gap: 0.75, gridTemplateColumns: desktop ? '1fr' : 'repeat(auto-fill, minmax(104px, 1fr))' }}>
        {newestFirst.map((s, i) => (
          <ButtonBase key={s.id} data-testid="solve-row" onClick={() => setOpenId(s.id)}
            sx={{ contentVisibility: 'auto', containIntrinsicSize: '44px', borderRadius: 1, px: 1.5, py: 1, bgcolor: 'action.hover',
              justifyContent: desktop ? 'space-between' : 'center', gap: 1, fontVariantNumeric: 'tabular-nums' }}>
            {desktop && (
              <Typography component="span" variant="body2" color="text.secondary" aria-hidden>
                {newestFirst.length - i}
              </Typography>
            )}
            {s.comment && <ChatBubbleOutlined sx={{ fontSize: 14, color: 'primary.main', order: desktop ? 1 : 0 }} aria-label={t('sheet.comment')} />}
            <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.05rem', ml: desktop ? 'auto' : 0 }}>
              {formatSolve(s, settings.thousandths)}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
      {open && <SolveSheet solve={open} onClose={() => setOpenId(null)} />}
    </Box>
  );
}
