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
import { resolveTheme } from './theme/resolve';
import { AppBackground, themeVars } from './theme/AppBackground';
import { useBackgroundImageUrl } from './theme/useBackgroundImage';
import { TimerPane } from './timer/TimerPane';
import { TimesList } from './times/TimesList';
import { UndoProvider } from './components/UndoSnackbar';
import { StatsPane } from './stats/StatsPane';
import { GraphPanel } from './stats/GraphPanel';
import { DESKTOP_QUERY } from './layout/Shell';
import { E2EHooks } from './state/E2EHooks';
import { SettingsPage } from './settings/SettingsPage';
import { ThemePage } from './settings/ThemePage';
import { AboutPage } from './about/AboutPage';
import { ImportExportPage } from './io/ImportExportPage';
import { BackupReminder } from './io/BackupReminder';
import { UpdatePrompt } from './components/UpdatePrompt';

const storage = createDexieStorage();
const scrambles = createScrambleService();

function Themed() {
  const { settings, view } = useApp();
  const page = view === 'settings' ? <SettingsPage /> : view === 'about' ? <AboutPage /> : view === 'io' ? <ImportExportPage /> : view === 'theme' ? <ThemePage /> : undefined;
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const desktop = useMediaQuery(DESKTOP_QUERY, { noSsr: true });
  const resolved = useMemo(
    () => resolveTheme({ palette: settings.palette, customTheme: settings.customTheme, themeMode: settings.themeMode }, systemDark),
    [settings.palette, settings.customTheme, settings.themeMode, systemDark],
  );
  const theme = useMemo(() => makeTheme(resolved), [resolved]);
  const imageUrl = useBackgroundImageUrl();
  const image = imageUrl ? { url: imageUrl, dim: settings.backgroundDim } : null;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{ 'body[data-timing="true"] .hide-while-timing': { visibility: 'hidden' }, ...themeVars(resolved, image) }} />
      <AppBackground />
      <E2EHooks />
      <UndoProvider>
        <Shell
          timer={<TimerPane tools={desktop ? <GraphPanel /> : undefined} />}
          times={<TimesList />}
          stats={<StatsPane graph={!desktop} />}
          page={page}
        />
        <BackupReminder />
        <UpdatePrompt />
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
