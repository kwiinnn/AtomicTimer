import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { Solve } from '../../core/model';
import { formatAverage, formatSolve } from '../../core/time';
import { t } from '../i18n';
import { DESKTOP_QUERY } from '../layout/Shell';
import { useApp } from '../state/AppContext';
import { SolveSheet } from './SolveSheet';
import { useSessionStats } from '../stats/useSessionStats';

/** Rows rendered per page; more are added when the "show more" sentinel scrolls into view. */
export const PAGE = 100;

const avg = (v: number | null | undefined, thousandths: boolean) => (v === null || v === undefined ? '–' : formatAverage(v, thousandths));
const DESKTOP_COLUMNS = '2.75rem 1fr 1fr 1fr';

const Row = memo(function Row({ solve, number, desktop, thousandths, ao5, ao12, onOpen }: {
  solve: Solve;
  number: number;
  desktop: boolean;
  thousandths: boolean;
  ao5?: number | null;
  ao12?: number | null;
  onOpen: (id: string) => void;
}) {
  if (desktop) {
    return (
      <ButtonBase data-testid="solve-row" onClick={() => onOpen(solve.id)}
        sx={{ display: 'grid', gridTemplateColumns: DESKTOP_COLUMNS, alignItems: 'center', textAlign: 'right', px: 1.5, py: 0.75,
          borderRadius: 1, fontVariantNumeric: 'tabular-nums', '&:hover': { bgcolor: 'action.hover' } }}>
        <Typography component="span" variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>{number}</Typography>
        <Typography component="span" data-testid="row-time" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
          {solve.comment && <ChatBubbleOutlined sx={{ fontSize: 12, color: 'primary.main' }} aria-label={t('sheet.comment')} />}
          {formatSolve(solve, thousandths)}
        </Typography>
        <Typography component="span" variant="body2" data-testid="row-ao5">{avg(ao5, thousandths)}</Typography>
        <Typography component="span" variant="body2" data-testid="row-ao12">{avg(ao12, thousandths)}</Typography>
      </ButtonBase>
    );
  }
  return (
    <ButtonBase data-testid="solve-row" onClick={() => onOpen(solve.id)}
      sx={{ borderRadius: 1, px: 1.5, py: 1, bgcolor: 'action.hover', justifyContent: desktop ? 'space-between' : 'center', gap: 1,
        fontVariantNumeric: 'tabular-nums' }}>
      {desktop && (
        <Typography component="span" variant="body2" color="text.secondary" aria-hidden>{number}</Typography>
      )}
      {solve.comment && <ChatBubbleOutlined sx={{ fontSize: 14, color: 'primary.main', order: desktop ? 1 : 0 }} aria-label={t('sheet.comment')} />}
      <Typography component="span" sx={{ fontWeight: 700, fontSize: '1.05rem', ml: desktop ? 'auto' : 0 }}>
        {formatSolve(solve, thousandths)}
      </Typography>
    </ButtonBase>
  );
});

export function TimesList() {
  const { solves, settings, session } = useApp();
  const { series } = useSessionStats();
  const desktop = useMediaQuery(DESKTOP_QUERY, { noSsr: true });
  const [openId, setOpenId] = useState<string | null>(null);
  // Page count is tied to the session, so switching sessions starts from the first page again.
  const [paging, setPaging] = useState({ sessionId: session?.id, pages: 1 });
  const pages = paging.sessionId === session?.id ? paging.pages : 1;
  const visible = useMemo(() => {
    const out: Solve[] = [];
    for (let i = solves.length - 1; i >= 0 && out.length < pages * PAGE; i--) out.push(solves[i]!);
    return out;
  }, [solves, pages]);
  const open = openId ? solves.find(s => s.id === openId) : undefined;
  const more = solves.length > visible.length;

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) setPaging({ sessionId: session?.id, pages: pages + 1 });
    });
    io.observe(el);
    return () => io.disconnect();
  }, [more, pages, session?.id]);

  return (
    <Box data-testid="times-list" aria-label={t('times.label')} sx={{ p: 1, minHeight: '100%' }}>
      {solves.length === 0 && (
        <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>{t('times.empty')}</Typography>
      )}
      {desktop && solves.length > 0 && (
        <Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: DESKTOP_COLUMNS, textAlign: 'right', px: 1.5, pb: 0.5,
          color: 'text.secondary', typography: 'caption', borderBottom: 1, borderColor: 'divider', mb: 0.5 }}>
          <span style={{ textAlign: 'left' }}>#</span><span>{t('times.time')}</span><span>ao5</span><span>ao12</span>
        </Box>
      )}
      <Box sx={{ display: 'grid', gap: desktop ? 0 : 0.75, gridTemplateColumns: desktop ? '1fr' : 'repeat(auto-fill, minmax(104px, 1fr))' }}>
        {visible.map((s, i) => {
          const index = solves.length - 1 - i;
          return (
            <Row key={s.id} solve={s} number={index + 1} desktop={desktop} thousandths={settings.thousandths}
              ao5={desktop ? series.ao5[index] : undefined} ao12={desktop ? series.ao12[index] : undefined} onOpen={setOpenId} />
          );
        })}
      </Box>
      {more && (
        <Box ref={sentinel} sx={{ textAlign: 'center', py: 1 }}>
          <Button size="small" onClick={() => setPaging({ sessionId: session?.id, pages: pages + 1 })}>
            {t('times.more', { count: solves.length - visible.length })}
          </Button>
        </Box>
      )}
      {open && <SolveSheet solve={open} onClose={() => setOpenId(null)} />}
    </Box>
  );
}
