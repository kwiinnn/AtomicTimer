import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTheme } from '@mui/material/styles';
import { useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n';

/** Height the floating Glass pill takes: 44px strip plus 8px above and below. */
export const GLASS_STRIP = 60;

/** Cubic Timer style: three swipeable panes kept in sync with the tab strip. */
export function MobileTabs({ panes, topInset = 0 }: {
  panes: [ReactNode, ReactNode, ReactNode];
  /** Height of a toolbar floating over the panes (Glass), so the pill and content start below it. */
  topInset?: number;
}) {
  // In Glass the pill floats over the panes, which scroll under it, as on iOS. No fade mask: a mask would make
  // each pane a backdrop root and the frosted cards inside it would stop blurring what's behind them.
  const glass = useTheme().uiStyle === 'glass';
  const [tab, setTab] = useState(0);
  // Bumped on every switch; Glass restarts its capsule "flow" animation when data-flow flips a ↔ b.
  const [flow, setFlow] = useState(0);
  const change = (i: number) => {
    setTab(i);
    setFlow(f => f + 1);
  };
  const scroller = useRef<HTMLDivElement>(null);
  // While a tapped tab's smooth scroll is under way, the panes it passes must not re-select themselves.
  const target = useRef<number | null>(null);
  const release = useRef(0);
  const select = (i: number) => {
    change(i);
    target.current = i;
    // If the scroll is interrupted (a swipe mid-way), stop waiting for it and follow the panes again.
    window.clearTimeout(release.current);
    release.current = window.setTimeout(() => (target.current = null), 700);
    const el = scroller.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  return (
    <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Tabs value={tab} onChange={(_, v: number) => select(v)} variant="fullWidth" textColor="inherit"
        indicatorColor="secondary" className="hide-while-timing glass-tabs" data-flow={flow === 0 ? undefined : flow % 2 ? 'a' : 'b'}
        sx={[{ color: 'text.primary' }, glass && { position: 'absolute', top: topInset, left: 0, right: 0, zIndex: 2 }]}>
        <Tab label={t('tab.timer')} />
        <Tab label={t('tab.times')} />
        <Tab label={t('tab.stats')} />
      </Tabs>
      <Box ref={scroller}
        onScroll={e => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (target.current !== null) {
            if (Math.abs(el.scrollLeft - target.current * el.clientWidth) < 2) target.current = null;
            return;
          }
          if (i !== tab) change(i);
        }}
        sx={{ flex: 1, minHeight: 0, display: 'flex', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {panes.map((p, i) => (
          <Box key={i} role="tabpanel" sx={[{ flex: '0 0 100%', minWidth: 0, scrollSnapAlign: 'start', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
            glass && { paddingTop: `${topInset + GLASS_STRIP}px` }]}>
            {p}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
