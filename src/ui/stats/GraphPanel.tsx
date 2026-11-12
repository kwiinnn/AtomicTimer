import Paper from '@mui/material/Paper';
import { surfaceSx } from '../theme/surface';
import { useApp } from '../state/AppContext';
import { TimeGraph } from './TimeGraph';
import { useSessionStats } from './useSessionStats';

/** Desktop tool panel under the timer (bottom-left), like csTimer's tool boxes. */
export function GraphPanel() {
  const { settings, solves } = useApp();
  const stats = useSessionStats();
  if (solves.length === 0) return null;
  return (
    <Paper variant="outlined" data-no-timer sx={[{ width: 'min(100%, 460px)', p: 1 }, surfaceSx('content')]}>
      <TimeGraph stats={stats} discrete={settings.discreteGraph} thousandths={settings.thousandths} height={170} />
    </Paper>
  );
}
