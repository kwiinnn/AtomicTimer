import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import type { ReactNode } from 'react';
import { surfaceSx } from '../theme/surface';

/** Wide layout (csTimer-style): records sidebar on the left (stats above times), timer area on the right. */
export function DesktopPanes({ timer, times, stats }: { timer: ReactNode; times: ReactNode; stats: ReactNode }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
      <Box component="aside" className="hide-while-timing"
        sx={[{ width: 340, flexShrink: 0, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 0 },
          // Frosted glass over the theme gradient (or the chosen style's pane).
          surfaceSx('content', { edge: 'right' })]}>
        <Box sx={{ flexShrink: 0, maxHeight: '50%', overflowY: 'auto' }}>{stats}</Box>
        <Divider />
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{times}</Box>
      </Box>
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>{timer}</Box>
    </Box>
  );
}
