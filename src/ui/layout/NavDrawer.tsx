import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Palette from '@mui/icons-material/Palette';
import SettingsIcon from '@mui/icons-material/Settings';
import SwapVert from '@mui/icons-material/SwapVert';
import Timer from '@mui/icons-material/Timer';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { t, type MessageKey } from '../i18n';
import { useApp, type View } from '../state/AppContext';
import { PALETTES } from '../theme/palettes';

/** Views and dialogs that exist so far; later features register here. */
export const ENABLED_NAV = new Set<string>(['timer', 'theme', 'settings', 'about']);

export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { view, setView, setThemeDialogOpen, settings } = useApp();
  const item = (key: MessageKey, icon: ReactNode, onClick: () => void, id: string, selected = false) => (
    <ListItemButton key={id} selected={selected} disabled={!ENABLED_NAV.has(id)}
      onClick={() => { onClose(); onClick(); }}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={t(key)} />
    </ListItemButton>
  );
  const go = (v: View) => () => setView(v);
  return (
    <Drawer open={open} onClose={onClose}>
      <Box sx={{ width: 280 }} role="navigation">
        <Box sx={{ bgcolor: PALETTES[settings.palette].primary, color: '#fff', px: 2, py: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('appName')}</Typography>
        </Box>
        <List>
          {item('nav.timer', <Timer />, go('timer'), 'timer', view === 'timer')}
          {item('nav.theme', <Palette />, () => setThemeDialogOpen(true), 'theme')}
          {item('nav.io', <SwapVert />, go('io'), 'io', view === 'io')}
          {item('nav.settings', <SettingsIcon />, go('settings'), 'settings', view === 'settings')}
          {item('nav.about', <InfoOutlined />, go('about'), 'about', view === 'about')}
        </List>
      </Box>
    </Drawer>
  );
}
