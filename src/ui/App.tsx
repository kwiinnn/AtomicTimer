import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/700.css';
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
import { StatsPane } from './stats/StatsPane';
import { E2EHooks } from './state/E2EHooks';
import { SettingsPage } from './settings/SettingsPage';
import { ThemeDialog } from './settings/ThemeDialog';
import { AboutPage } from './about/AboutPage';
import { ImportExportPage } from './io/ImportExportPage';
import { BackupReminder } from './io/BackupReminder';

const storage = createDexieStorage();
const scrambles = createScrambleService();

function Themed() {
  const { settings, view } = useApp();
  const page = view === 'settings' ? <SettingsPage /> : view === 'about' ? <AboutPage /> : view === 'io' ? <ImportExportPage /> : undefined;
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const mode = settings.themeMode === 'system' ? (systemDark ? 'dark' : 'light') : settings.themeMode;
  const theme = useMemo(() => makeTheme(mode, settings.palette), [mode, settings.palette]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ 'body[data-timing="true"] .hide-while-timing': { visibility: 'hidden' } }} />
      <E2EHooks />
      <UndoProvider>
        <Shell
          timer={<TimerPane />}
          times={<TimesList />}
          stats={<StatsPane />}
          page={page}
        />
        <ThemeDialog />
        <BackupReminder />
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
