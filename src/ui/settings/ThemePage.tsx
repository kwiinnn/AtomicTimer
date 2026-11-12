import Check from '@mui/icons-material/Check';
import Tune from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { downscaleImage } from '../../platform/images';
import { APP_FONT_IDS, FONT_IDS, type FontId, type TimerFontId } from '../../core/settings';
import { FONTS, timerFamily } from '../theme/fonts';
import { FontPicker } from './FontPicker';
import { StylePicker } from './StylePicker';
import { PALETTE_IDS, type CustomTheme, type PaletteChoice, type ThemeMode } from '../../core/settings';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { PALETTES } from '../theme/palettes';
import { resolveTheme } from '../theme/resolve';
import { surfaceSx } from '../theme/surface';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={[{ p: 2, mb: 2 }, surfaceSx('content', { materialAlpha: 0.75 })]}>
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
  const { settings, updateSettings, storage } = useApp();
  const hasImage = useLiveQuery(async () => !!(await storage.getAsset('background')), [storage]) ?? false;
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const pickImage = async (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    try {
      await storage.putAsset('background', await downscaleImage(file));
      setImageError(false);
      await updateSettings({ backgroundImage: true });
    } catch {
      setImageError(true);
    }
  };
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

  const resolved = useMemo(
    () => resolveTheme({ palette: settings.palette, customTheme: settings.customTheme, themeMode: settings.themeMode }, systemDark),
    [settings.palette, settings.customTheme, settings.themeMode, systemDark],
  );
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

        <Section title={t('theme.style')}>
          <StylePicker value={settings.uiStyle} onChange={uiStyle => void updateSettings({ uiStyle })}
            resolved={resolved} fontFamily={FONTS[settings.appFont].family} />
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

        <Section title={t('theme.appFont')}>
          <FontPicker label={t('theme.appFont')} sample={t('font.sample')} ids={APP_FONT_IDS} value={settings.appFont}
            onChange={(appFont: FontId) => void updateSettings({ appFont })} />
        </Section>

        <Section title={t('theme.timerFont')}>
          <FontPicker label={t('theme.timerFont')} sample="12.34" ids={FONT_IDS} value={settings.timerFont}
            onChange={(timerFont: TimerFontId) => void updateSettings({ timerFont })}
            extra={[{ id: 'app', label: t('font.sameAsApp'), family: timerFamily('app', settings.appFont) }]} />
        </Section>

        <Section title={t('theme.background')}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{t('theme.backgroundHelp')}</Typography>
          <input ref={fileInput} type="file" accept="image/*" hidden data-testid="background-input" onChange={e => void pickImage(e.target.files?.[0])} />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="contained" onClick={() => fileInput.current?.click()}>{t('theme.chooseImage')}</Button>
            {hasImage && (
              <Button color="error" onClick={() => void storage.putAsset('background', null).then(() => updateSettings({ backgroundImage: false }))}>
                {t('theme.removeImage')}
              </Button>
            )}
          </Box>
          {imageError && <Typography color="error" sx={{ mt: 1 }}>{t('theme.imageFailed')}</Typography>}
          {hasImage && (
            <Box sx={{ mt: 2 }}>
              <FormControlLabel label={t('theme.showImage')}
                control={<Switch checked={settings.backgroundImage} onChange={e => void updateSettings({ backgroundImage: e.target.checked })}
                  slotProps={{ input: { role: 'switch', 'aria-label': t('theme.showImage') } }} />} />
              <Typography id="theme-dim">{t('theme.dim')}: <b>{Math.round(settings.backgroundDim * 100)}%</b></Typography>
              <Slider aria-labelledby="theme-dim" min={0} max={0.9} step={0.05} value={settings.backgroundDim}
                disabled={!settings.backgroundImage} onChange={(_, v) => void updateSettings({ backgroundDim: v as number })}
                valueLabelDisplay="auto" valueLabelFormat={v => `${Math.round(v * 100)}%`} />
            </Box>
          )}
        </Section>
      </Box>
    </Box>
  );
}
