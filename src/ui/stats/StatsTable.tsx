import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { STAT_KEYS, type SessionStats } from '../../core/stats/session';
import { formatAverage, formatTime } from '../../core/time';
import { t } from '../i18n';

const show = (v: number | null, thousandths: boolean) => (v === null ? '–' : formatAverage(v, thousandths));

export function StatsTable({ stats, title, thousandths, idPrefix = 'stat' }: {
  stats: SessionStats;
  title: string;
  thousandths: boolean;
  idPrefix?: string;
}) {
  const single = (v: number | null) => (v === null ? '–' : formatTime(v, thousandths));
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Typography>
      <Box data-testid={idPrefix === 'stat' ? 'stats-summary' : `${idPrefix}-summary`}
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, my: 1, fontVariantNumeric: 'tabular-nums' }}>
        {[
          [t('stats.solves'), `${stats.countValid}/${stats.count}`],
          [t('stats.mean'), show(stats.mean, thousandths)],
          [t('stats.bestSingle'), single(stats.best)],
          [t('stats.worstSingle'), single(stats.worst)],
        ].map(([label, value]) => (
          <Box key={label}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
          </Box>
        ))}
      </Box>
      <Table size="small" sx={{ fontVariantNumeric: 'tabular-nums', '& td, & th': { px: 1 } }}>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell align="right">{t('stats.current')}</TableCell>
            <TableCell align="right">{t('stats.best')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {STAT_KEYS.map(key => (
            <TableRow key={key}>
              <TableCell component="th" scope="row" sx={{ fontWeight: 700 }}>{key}</TableCell>
              <TableCell align="right" data-testid={`${idPrefix}-${key}-current`}>{show(stats.rows[key].current, thousandths)}</TableCell>
              <TableCell align="right" data-testid={`${idPrefix}-${key}-best`}>{show(stats.rows[key].best, thousandths)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
