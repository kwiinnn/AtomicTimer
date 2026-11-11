import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import type { ReactNode } from 'react';

/** Wide layout: timer in the centre, times list and stats in a right sidebar. */
export function DesktopPanes({ timer, times, stats }: { timer: ReactNode; times: ReactNode; stats: ReactNode }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>{timer}</Box>
      <Box component="aside" className="hide-while-timing"
        sx={{ width: 360, flexShrink: 0, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{times}</Box>
        <Divider />
        <Box sx={{ maxHeight: '55%', overflowY: 'auto' }}>{stats}</Box>
      </Box>
    </Box>
  );
}
