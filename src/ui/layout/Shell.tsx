import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { SessionDialogs } from '../sessions/SessionDialogs';
import { DesktopPanes } from './DesktopPanes';
import { MobileTabs } from './MobileTabs';
import { NavDrawer } from './NavDrawer';
import { TopBar } from './TopBar';

export const DESKTOP_QUERY = '(min-width:1024px)';

export function Shell({ timer, times, stats, page }: { timer: ReactNode; times: ReactNode; stats: ReactNode; page?: ReactNode }) {
  const desktop = useMediaQuery(DESKTOP_QUERY, { noSsr: true });
  const [drawer, setDrawer] = useState(false);
  // Glass on phones: the toolbar floats over the panes too, so content scrolls under both glass bars (as on iOS)
  // instead of being cut off at the toolbar's edge.
  const floating = useTheme().uiStyle === 'glass' && !desktop && !page;
  const bar = useRef<HTMLElement>(null);
  const [barHeight, setBarHeight] = useState(0);
  useLayoutEffect(() => {
    const el = bar.current;
    if (!floating || !el) return;
    const measure = () => setBarHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [floating]);
  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AppBar ref={bar} position="static" className="hide-while-timing"
        sx={floating ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 } : undefined}>
        <TopBar onMenu={() => setDrawer(true)} showTitle={desktop} />
      </AppBar>
      {page ?? (desktop ? <DesktopPanes timer={timer} times={times} stats={stats} />
        : <MobileTabs panes={[timer, times, stats]} topInset={floating ? barHeight : 0} />)}
      <NavDrawer open={drawer} onClose={() => setDrawer(false)} />
      <SessionDialogs />
    </Box>
  );
}
