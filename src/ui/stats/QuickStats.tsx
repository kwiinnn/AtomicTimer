import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { formatAverage } from '../../core/time';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { phoneCardSx } from '../theme/surface';
import { useSessionStats } from './useSessionStats';

/** Phone timer view, bottom-left: the current averages at a glance (the full table lives on the Stats tab). */
export function QuickStats() {
  const { solves, settings } = useApp();
  const stats = useSessionStats();
  if (solves.length === 0) return null;
  const show = (v: number | null) => (v === null ? '–' : formatAverage(v, settings.thousandths));
  const rows: [id: string, label: string, value: string][] = [
    ['ao5', 'ao5', show(stats.rows.ao5.current)],
    ['ao12', 'ao12', show(stats.rows.ao12.current)],
    ['ao50', 'ao50', show(stats.rows.ao50.current)],
    ['ao100', 'ao100', show(stats.rows.ao100.current)],
    ['mean', t('stats.mean'), show(stats.mean)],
    ['count', t('stats.count'), String(stats.count)],
  ];
  return (
    <Box data-testid="quick-stats" className="phone-card" sx={[{ display: 'inline-grid', gridTemplateColumns: 'auto auto', columnGap: 3,
      rowGap: 0.5, minWidth: 160, fontVariantNumeric: 'tabular-nums' }, phoneCardSx('12px 16px')]}>
      {rows.map(([id, label, value]) => (
        <Box key={id} sx={{ display: 'contents' }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="body2" data-testid={`quick-${id}`} sx={{ fontWeight: 700, textAlign: 'right' }}>{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}
