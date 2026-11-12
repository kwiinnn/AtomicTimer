import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import pkg from '../../../package.json';
import { t } from '../i18n';

const NOTICES: [string, string, string][] = [
  ['cubing.js', 'MPL-2.0', 'https://github.com/cubing/cubing.js'],
  ['React', 'MIT', 'https://react.dev'],
  ['MUI (Material UI) and Material Icons', 'MIT / Apache-2.0', 'https://mui.com'],
  ['Dexie.js', 'Apache-2.0', 'https://dexie.org'],
  ['uPlot', 'MIT', 'https://github.com/leeoniya/uPlot'],
  ['Quicksand font', 'OFL-1.1', 'https://fonts.google.com/specimen/Quicksand'],
  ['Inter, Nunito, Poppins, DM Sans, Space Grotesk, Lora, Fraunces, Newsreader fonts', 'OFL-1.1', 'https://fontsource.org'],
  ['Source Serif 4 font (Adobe)', 'OFL-1.1', 'https://github.com/adobe-fonts/source-serif'],
  ['IBM Plex Sans, Serif and Mono fonts', 'OFL-1.1', 'https://github.com/IBM/plex'],
  ['JetBrains Mono font', 'OFL-1.1', 'https://www.jetbrains.com/lp/mono/'],
  ['Roboto Mono font', 'OFL-1.1', 'https://fonts.google.com/specimen/Roboto+Mono'],
  ['Orbitron font', 'OFL-1.1', 'https://fonts.google.com/specimen/Orbitron'],
  ['DSEG7 font by keshikan', 'OFL-1.1', 'https://github.com/keshikan/DSEG'],
];

export function AboutPage() {
  return (
    <Box component="main" sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>{t('about.title')}</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">{t('appName')} <Typography component="span" color="text.secondary">v{pkg.version}</Typography></Typography>
          <Typography sx={{ mt: 1 }}>
            A speedcubing timer for desktop and mobile. Released under the MIT license.
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Inspired by <Link href="https://github.com/hato-ya/CubicTimer" target="_blank" rel="noreferrer">Cubic Timer</Link> by hatoya
            and <Link href="https://github.com/aricneto/TwistyTimer" target="_blank" rel="noreferrer">Twisty Timer</Link> by Ariovaldo Neto.
            Atomic Timer is an independent implementation and contains no code or assets from either project.
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Open-source software</Typography>
          {NOTICES.map(([name, license, url]) => (
            <Typography key={name}>
              <Link href={url} target="_blank" rel="noreferrer">{name}</Link> — {license}
            </Typography>
          ))}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            cubing.js is used unmodified under the Mozilla Public License 2.0; its source is available at the link above.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
