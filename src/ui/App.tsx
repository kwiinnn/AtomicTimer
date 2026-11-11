import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/700.css';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemo } from 'react';
import { createScrambleService } from '../platform/scramble';
import { createDexieStorage } from '../platform/storage/dexie';
import { t } from './i18n';
import { Shell } from './layout/Shell';
import { AppProvider, useApp } from './state/AppContext';
import { makeTheme } from './theme/makeTheme';
import { TimerPane } from './timer/TimerPane';
import { TimesList } from './times/TimesList';
import { UndoProvider } from './components/UndoSnackbar';

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
      <GlobalStyles styles={{ 'body[data-timing="true"] .hide-while-timing': { visibility: 'hidden' } }} />
      <UndoProvider>
        <Shell
          timer={<TimerPane />}
          times={<TimesList />}
          stats={<Box data-testid="stats-pane" sx={{ p: 2 }} />}
        />
      </UndoProvider>
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
