import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { useMemo, useState, type ReactNode } from 'react';
import { computeSessionStats, filterToday } from '../../core/stats/session';
import { useSessionStats } from './useSessionStats';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { StatsTable } from './StatsTable';
import { TimeGraph } from './TimeGraph';
import { phoneCardSx } from '../theme/surface';

const GRAPH_KEY = 'atomic-timer.graphOpen';
const readGraphOpen = () => {
  try {
    return localStorage.getItem(GRAPH_KEY) !== 'false';
  } catch {
    return true;
  }
};

/** On phones a stats section is a card (frosted in Glass); on desktop it sits in the frosted side pane as is. */
function Section({ phone, children }: { phone: boolean; children: ReactNode }) {
  return phone ? <Box className="phone-card" sx={phoneCardSx()}>{children}</Box> : <>{children}</>;
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
  const [graphOpen, setGraphOpen] = useState(readGraphOpen);
  const toggleGraph = () => {
    setGraphOpen(open => {
      try {
        localStorage.setItem(GRAPH_KEY, String(!open));
      } catch {
        // per-viewer convenience only
      }
      return !open;
    });
  };

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
        <Section phone>
          <Button size="small" onClick={toggleGraph} endIcon={graphOpen ? <ExpandLess /> : <ExpandMore />} sx={{ ml: 1 }}>
            {t('stats.graph')}
          </Button>
          <Collapse in={graphOpen} unmountOnExit>
            <TimeGraph stats={stats} discrete={settings.discreteGraph} thousandths={thousandths} />
          </Collapse>
        </Section>
      )}
    </Box>
  );
}
