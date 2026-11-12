import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { t } from '../i18n';

export function ScrambleBox({ scramble, error, scale, onNext, disabled }: {
  scramble: string | null;
  error: string | null;
  scale: number;
  onNext: () => void;
  disabled: boolean;
}) {
  const long = (scramble?.length ?? 0) > 120;
  return (
    <Box data-no-timer role="button" tabIndex={-1} aria-label={t('scramble.next')} onClick={disabled ? undefined : onNext}
      className="hide-while-timing"
      sx={{ px: 2, py: 1.5, cursor: disabled ? 'default' : 'pointer', textAlign: 'center', minHeight: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {scramble ? (
        <Typography data-testid="scramble-text" component="p"
          sx={{ fontSize: `calc(${long ? 0.95 : 1.3}rem * ${scale})`, fontWeight: 500, wordSpacing: '0.15em', lineHeight: 1.5,
            fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre-wrap' }}>
          {scramble}
        </Typography>
      ) : error && !scramble ? (
        <Typography color="error">{t('scramble.failed')}</Typography>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
          <CircularProgress size={18} /> {t('scramble.generating')}
        </Box>
      )}
    </Box>
  );
}
