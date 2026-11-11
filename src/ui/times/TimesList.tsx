import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { Solve } from '../../core/model';
import { formatSolve } from '../../core/time';
import { t } from '../i18n';
import { DESKTOP_QUERY } from '../layout/Shell';
import { useApp } from '../state/AppContext';
import { SolveSheet } from './SolveSheet';

/** Rows rendered per page; more are added when the "show more" sentinel scrolls into view. */
export const PAGE = 100;

const Row = memo(function Row({ solve, number, desktop, thousandths, onOpen }: {
  solve: Solve;
  number: number;
  desktop: boolean;
  thousandths: boolean;
  onOpen: (id: string) => void;
}) {
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
      <Box sx={{ display: 'grid', gap: 0.75, gridTemplateColumns: desktop ? '1fr' : 'repeat(auto-fill, minmax(104px, 1fr))' }}>
        {visible.map((s, i) => (
          <Row key={s.id} solve={s} number={solves.length - i} desktop={desktop} thousandths={settings.thousandths} onOpen={setOpenId} />
        ))}
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
