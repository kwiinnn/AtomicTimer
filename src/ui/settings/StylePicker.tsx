import Check from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import { ThemeProvider } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { UI_STYLE_IDS, type UiStyle } from '../../core/settings';
import { t } from '../i18n';
import { makeTheme } from '../theme/makeTheme';
import type { ResolvedTheme } from '../theme/resolve';

interface Props {
  value: UiStyle;
  onChange: (s: UiStyle) => void;
  resolved: ResolvedTheme;
  fontFamily: string;
  /** Extra background layers over the gradient for a style's preview (e.g. Glass blobs). */
  backdropFor?: (s: UiStyle) => string | null;
}

/** One card per style, each a miniature drawn with that style's real theme over the current palette. */
export function StylePicker({ value, onChange, resolved, fontFamily, backdropFor }: Props) {
  const themes = useMemo(
    () => Object.fromEntries(UI_STYLE_IDS.map(id => [id, makeTheme(resolved, fontFamily, id)])) as Record<UiStyle, ReturnType<typeof makeTheme>>,
    [resolved, fontFamily],
  );
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 1.5 }}>
      {UI_STYLE_IDS.map(id => {
        const selected = value === id;
        const extra = backdropFor?.(id);
        return (
          <ButtonBase key={id} aria-label={t(`style.${id}`)} aria-pressed={selected} onClick={() => onChange(id)}
            sx={{ flexDirection: 'column', alignItems: 'stretch', borderRadius: 2, overflow: 'hidden', border: 2,
              borderColor: selected ? 'text.primary' : 'divider' }}>
            <Box aria-hidden sx={{ position: 'relative', height: 84, p: 1, color: resolved.ink,
              background: extra ? `${extra}, ${resolved.gradient}` : resolved.gradient }}>
              <ThemeProvider theme={themes[id]}>
                <Paper sx={{ height: '100%', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Chip size="small" label="1.23" tabIndex={-1} sx={{ height: 20, fontSize: 11 }} />
                  <Button size="small" variant="contained" tabIndex={-1} component="span" sx={{ minWidth: 0, py: 0, px: 1.5, fontSize: 11 }}>Aa</Button>
                </Paper>
              </ThemeProvider>
              {selected && <Check sx={{ position: 'absolute', top: 6, right: 8 }} />}
            </Box>
            <Typography variant="body2" sx={{ px: 1, py: 0.75, textAlign: 'left', bgcolor: 'background.paper' }}>{t(`style.${id}`)}</Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
}
