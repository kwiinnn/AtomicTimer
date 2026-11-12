import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState, type ReactNode } from 'react';
import { SessionDialogs } from '../sessions/SessionDialogs';
import { DesktopPanes } from './DesktopPanes';
import { MobileTabs } from './MobileTabs';
import { NavDrawer } from './NavDrawer';
import { TopBar } from './TopBar';

export const DESKTOP_QUERY = '(min-width:1024px)';

export function Shell({ timer, times, stats, page }: { timer: ReactNode; times: ReactNode; stats: ReactNode; page?: ReactNode }) {
  const desktop = useMediaQuery(DESKTOP_QUERY, { noSsr: true });
  const [drawer, setDrawer] = useState(false);
  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" className="hide-while-timing">
        <TopBar onMenu={() => setDrawer(true)} showTitle={desktop} />
      </AppBar>
      {page ?? (desktop ? <DesktopPanes timer={timer} times={times} stats={stats} /> : <MobileTabs panes={[timer, times, stats]} />)}
      <NavDrawer open={drawer} onClose={() => setDrawer(false)} />
      <SessionDialogs />
    </Box>
  );
}
