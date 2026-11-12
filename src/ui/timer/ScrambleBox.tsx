import Refresh from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
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
  const generating = !scramble && !error;
  return (
    <Box data-no-timer className="hide-while-timing" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box role="button" tabIndex={-1} aria-label={t('scramble.next')} onClick={disabled ? undefined : onNext}
        sx={{ px: 2, pt: 1.5, pb: 0.5, cursor: disabled ? 'default' : 'pointer', textAlign: 'center', minHeight: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}>
        {scramble ? (
          <Typography data-testid="scramble-text" component="p"
            sx={{ fontSize: `calc(${long ? 0.95 : 1.3}rem * ${scale})`, fontWeight: 500, wordSpacing: '0.15em', lineHeight: 1.5,
              fontVariantNumeric: 'tabular-nums', whiteSpace: 'pre-wrap' }}>
            {scramble}
          </Typography>
        ) : error ? (
          <Typography color="error">{t('scramble.failed')}</Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
            <CircularProgress size={18} /> {t('scramble.generating')}
          </Box>
        )}
      </Box>
      {/* A visible way to get a new scramble (tapping the scramble, N and → also work). */}
      <IconButton size="small" color="inherit" aria-label={t('scramble.new')} disabled={disabled || generating} onClick={onNext}
        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}>
        <Refresh fontSize="small" />
      </IconButton>
    </Box>
  );
}
