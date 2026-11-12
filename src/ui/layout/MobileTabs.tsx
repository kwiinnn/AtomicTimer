import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { primaryOf } from '../theme/palettes';

/** Cubic Timer style: three swipeable panes kept in sync with the tab strip. */
export function MobileTabs({ panes }: { panes: [ReactNode, ReactNode, ReactNode] }) {
  const { settings } = useApp();
  const [tab, setTab] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const select = (i: number) => {
    setTab(i);
    const el = scroller.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  return (
    <>
      <Tabs value={tab} onChange={(_, v: number) => select(v)} variant="fullWidth" textColor="inherit"
        indicatorColor="secondary" className="hide-while-timing" sx={{ bgcolor: primaryOf(settings), color: '#fff' }}>
        <Tab label={t('tab.timer')} />
        <Tab label={t('tab.times')} />
        <Tab label={t('tab.stats')} />
      </Tabs>
      <Box ref={scroller}
        onScroll={e => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== tab) setTab(i);
        }}
        sx={{ flex: 1, minHeight: 0, display: 'flex', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {panes.map((p, i) => (
          <Box key={i} role="tabpanel" sx={{ flex: '0 0 100%', minWidth: 0, scrollSnapAlign: 'start', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {p}
          </Box>
        ))}
      </Box>
    </>
  );
}
