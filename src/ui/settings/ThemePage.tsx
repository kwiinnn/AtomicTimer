import Check from '@mui/icons-material/Check';
import Tune from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Slider from '@mui/material/Slider';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { ReactNode } from 'react';
import { PALETTE_IDS, type CustomTheme, type PaletteChoice, type ThemeMode } from '../../core/settings';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { PALETTES } from '../theme/palettes';
import { resolveTheme } from '../theme/resolve';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: theme => alpha(theme.palette.background.paper, 0.75), backdropFilter: 'blur(14px)' }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const id = `colour-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box component="input" id={id} type="color" value={value} onChange={e => onChange((e.target as HTMLInputElement).value)}
        sx={{ width: 48, height: 36, p: 0, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'transparent', cursor: 'pointer' }} />
      <Box component="label" htmlFor={id}>
        <Typography>{label}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
      </Box>
    </Box>
  );
}

export function ThemePage() {
  const { settings, updateSettings } = useApp();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const custom = settings.palette === 'custom';
  const setCustom = (patch: Partial<CustomTheme>) => void updateSettings({ palette: 'custom', customTheme: { ...settings.customTheme, ...patch } });

  const card = (id: PaletteChoice, label: string, gradient: string, ink: string, icon?: ReactNode) => {
    const selected = settings.palette === id;
    return (
      <ButtonBase key={id} aria-label={label} aria-pressed={selected} onClick={() => void updateSettings({ palette: id })}
        sx={{ flexDirection: 'column', alignItems: 'stretch', borderRadius: 2, overflow: 'hidden', border: 2,
          borderColor: selected ? 'text.primary' : 'divider' }}>
        <Box sx={{ background: gradient, color: ink, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected ? <Check /> : icon}
        </Box>
        <Typography variant="body2" sx={{ px: 1, py: 0.75, textAlign: 'left', bgcolor: 'background.paper' }}>{label}</Typography>
      </ButtonBase>
    );
  };

  const customResolved = resolveTheme({ palette: 'custom', customTheme: settings.customTheme, themeMode: settings.themeMode }, systemDark);

  return (
    <Box component="main" sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 700 }}>{t('theme.title')}</Typography>

        <Section title={t('theme.mode')}>
          <RadioGroup row aria-label={t('theme.mode')} value={settings.themeMode}
            onChange={e => void updateSettings({ themeMode: e.target.value as ThemeMode })}>
            {(['system', 'light', 'dark'] as const).map(m => (
              <FormControlLabel key={m} value={m} control={<Radio />} label={t(`theme.${m}`)} disabled={custom} />
            ))}
          </RadioGroup>
          {custom && <Typography variant="body2" color="text.secondary">{t('theme.customModeHint')}</Typography>}
        </Section>

        <Section title={t('theme.presets')}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 1.5 }}>
            {PALETTE_IDS.map(id => {
              const r = resolveTheme({ palette: id, customTheme: settings.customTheme, themeMode: settings.themeMode }, systemDark);
              return card(id, PALETTES[id].label, r.gradient, r.ink);
            })}
            {card('custom', t('theme.custom'), customResolved.gradient, customResolved.ink, <Tune />)}
          </Box>
        </Section>

        {custom && (
          <Section title={t('theme.customTitle')}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
              <ColourField label={t('theme.from')} value={settings.customTheme.from} onChange={from => setCustom({ from })} />
              <ColourField label={t('theme.to')} value={settings.customTheme.to} onChange={to => setCustom({ to })} />
              <ColourField label={t('theme.accent')} value={settings.customTheme.accent} onChange={accent => setCustom({ accent })} />
            </Box>
            <Typography id="theme-angle">{t('theme.angle')}: <b>{settings.customTheme.angle}°</b></Typography>
            <Slider aria-labelledby="theme-angle" min={0} max={360} step={5} value={settings.customTheme.angle}
              onChange={(_, v) => setCustom({ angle: v as number })} valueLabelDisplay="auto" valueLabelFormat={v => `${v}°`} />
          </Section>
        )}
      </Box>
    </Box>
  );
}
