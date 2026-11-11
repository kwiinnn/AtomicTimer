import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/700.css';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemo } from 'react';
import { createScrambleService } from '../platform/scramble';
import { createDexieStorage } from '../platform/storage/dexie';
import { t } from './i18n';
import { Shell } from './layout/Shell';
import { AppProvider, useApp } from './state/AppContext';
import { makeTheme } from './theme/makeTheme';

const storage = createDexieStorage();
const scrambles = createScrambleService();

function Themed() {
  const { settings } = useApp();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const mode = settings.themeMode === 'system' ? (systemDark ? 'dark' : 'light') : settings.themeMode;
  const theme = useMemo(() => makeTheme(mode, settings.palette), [mode, settings.palette]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Shell
        timer={<Box data-testid="timer-display" sx={{ m: 'auto', fontSize: 64 }}>0.00</Box>}
        times={<Box data-testid="times-list" sx={{ p: 2 }} />}
        stats={<Box data-testid="stats-pane" sx={{ p: 2 }} />}
      />
    </ThemeProvider>
  );
}

export function App() {
  return (
    <AppProvider storage={storage} scrambles={scrambles} fallback={<p style={{ padding: 16 }}>{t('common.loading')}</p>}>
      <Themed />
    </AppProvider>
  );
}
