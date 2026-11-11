import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import type { SessionStats } from '../../core/stats/session';
import { formatAverage } from '../../core/time';
import { t } from '../i18n';

// Categorical slots 1–3 of the validated reference palette (light / dark steps). Identity also comes from the legend.
const SERIES = {
  light: ['#2a78d6', '#eb6834', '#1baf7a'],
  dark: ['#3987e5', '#d95926', '#199e70'],
};

const finiteOrNull = (v: number | null) => (v === null || !Number.isFinite(v) ? null : v / 1000);

/** Solve history with ao5 / ao12. DNFs and not-yet-defined averages are gaps. */
export function TimeGraph({ stats, discrete, thousandths, height = 220 }: { stats: SessionStats; discrete: boolean; thousandths: boolean; height?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const mode = theme.palette.mode;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const colors = SERIES[mode];
    const ink = theme.palette.text.secondary;
    const grid = theme.palette.divider;
    const n = stats.series.single.length;
    const data: uPlot.AlignedData = [
      Array.from({ length: n }, (_, i) => i + 1),
      stats.series.single.map(finiteOrNull),
      stats.series.ao5.map(finiteOrNull),
      stats.series.ao12.map(finiteOrNull),
    ];
    const fmt = (_: uPlot, v: number | null) => (v === null || v === undefined ? '–' : formatAverage(v * 1000, thousandths));
    const line = (stroke: string, width: number, label: string): uPlot.Series => ({
      label,
      stroke,
      width: discrete ? 0 : width,
      spanGaps: false,
      value: fmt,
      points: { show: discrete || n < 60, size: discrete ? 5 : 4, fill: stroke, stroke },
    });
    const axis = (extra: Partial<uPlot.Axis> = {}): uPlot.Axis => ({
      stroke: ink,
      grid: { stroke: grid, width: 1 },
      ticks: { stroke: grid, width: 1 },
      font: '12px Quicksand, system-ui, sans-serif',
      ...extra,
    });
    const plot = new uPlot(
      {
        width: el.clientWidth || 320,
        height,
        cursor: { points: { size: 8 } },
        legend: { show: true, live: true },
        scales: { x: { time: false } },
        axes: [axis(), axis({ size: 56, values: (_, ticks) => ticks.map(v => formatAverage(v * 1000, false)) })],
        series: [
          { label: '#', value: (_, v) => (v === null || v === undefined ? '' : String(v)) },
          line(colors[0]!, 1, t('stats.single')),
          line(colors[1]!, 2, 'ao5'),
          line(colors[2]!, 2, 'ao12'),
        ],
      },
      data,
      el,
    );
    const ro = new ResizeObserver(() => plot.setSize({ width: el.clientWidth || 320, height }));
    ro.observe(el);
    return () => {
      ro.disconnect();
      plot.destroy();
    };
  }, [stats, discrete, thousandths, height, mode, theme.palette.text.secondary, theme.palette.divider]);

  return (
    <Box data-testid="time-graph" ref={host} role="img" aria-label={t('stats.graph')}
      sx={{ px: 1, '& .u-legend': { fontSize: 12, color: 'text.secondary' }, '& .u-legend th': { fontWeight: 500 } }} />
  );
}
