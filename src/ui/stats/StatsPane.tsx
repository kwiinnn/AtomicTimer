import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useMemo, useState, type ReactNode } from 'react';
import { computeSessionStats, filterToday } from '../../core/stats/session';
import { useSessionStats } from './useSessionStats';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { StatsTable } from './StatsTable';
import { TimeGraph } from './TimeGraph';
import { phoneCardSx } from '../theme/surface';

/** On phones a stats section is a card (frosted in Glass); on desktop it sits in the frosted side pane as is. */
function Section({ phone, padding, children }: { phone: boolean; padding?: string; children: ReactNode }) {
  return phone ? <Box className="phone-card" sx={phoneCardSx(padding)}>{children}</Box> : <>{children}</>;
}

/** Session (and optional today) tables, plus the graph unless `graph` is false (desktop shows it under the timer). */
export function StatsPane({ graph = true }: { graph?: boolean }) {
  const { solves, settings } = useApp();
  const { trimPct, dnfRule, thousandths } = settings;
  const stats = useSessionStats();
  const [today] = useState(() => new Date());
  const todayStats = useMemo(
    () => (settings.showTodayStats ? computeSessionStats(filterToday(solves, today), { trimPct, dnfRule }) : null),
    [settings.showTodayStats, solves, today, trimPct, dnfRule],
  );
  return (
    <Box data-testid="stats-pane" sx={{ pb: 2 }}>
      {solves.length === 0 && <Typography color="text.secondary" sx={{ p: 2 }}>{t('stats.empty')}</Typography>}
      {settings.showSessionStats && (
        <Section phone={graph}><StatsTable stats={stats} title={t('stats.session')} thousandths={thousandths} /></Section>
      )}
      {todayStats && (
        <Section phone={graph}><StatsTable stats={todayStats} title={t('stats.today')} thousandths={thousandths} idPrefix="today" /></Section>
      )}
      {graph && (
        <Section phone padding="8px 0">
          <TimeGraph stats={stats} discrete={settings.discreteGraph} thousandths={thousandths} />
        </Section>
      )}
    </Box>
  );
}
