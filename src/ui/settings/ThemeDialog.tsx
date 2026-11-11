import Check from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import { PALETTE_IDS, type ThemeMode } from '../../core/settings';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';
import { PALETTES } from '../theme/palettes';

export function ThemeDialog() {
  const { themeDialogOpen, setThemeDialogOpen, settings, updateSettings } = useApp();
  return (
    <Dialog open={themeDialogOpen} onClose={() => setThemeDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{t('theme.title')}</DialogTitle>
      <DialogContent>
        <Typography id="theme-mode" variant="subtitle2" color="text.secondary">{t('theme.mode')}</Typography>
        <RadioGroup row aria-labelledby="theme-mode" value={settings.themeMode}
          onChange={e => void updateSettings({ themeMode: e.target.value as ThemeMode })} sx={{ mb: 2 }}>
          {(['system', 'light', 'dark'] as const).map(m => (
            <FormControlLabel key={m} value={m} control={<Radio />} label={t(`theme.${m}`)} />
          ))}
        </RadioGroup>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>{t('theme.colour')}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5 }}>
          {PALETTE_IDS.map(id => {
            const p = PALETTES[id];
            const selected = settings.palette === id;
            return (
              <ButtonBase key={id} aria-label={p.label} aria-pressed={selected} onClick={() => void updateSettings({ palette: id })}
                sx={{ flexDirection: 'column', alignItems: 'stretch', borderRadius: 2, overflow: 'hidden', border: 2,
                  borderColor: selected ? 'text.primary' : 'divider' }}>
                <Box sx={{ bgcolor: p.primary, color: '#fff', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected && <Check />}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: p.secondary }} />
                  <Typography variant="body2">{p.label}</Typography>
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
