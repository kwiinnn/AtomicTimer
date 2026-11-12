import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { t, type MessageKey } from '../i18n';
import { ensureFont, FONTS, type FontInfo } from '../theme/fonts';

const GROUPS: { category: FontInfo['category']; title: MessageKey }[] = [
  { category: 'sans', title: 'font.sans' },
  { category: 'serif', title: 'font.serif' },
  { category: 'mono', title: 'font.mono' },
  { category: 'display', title: 'font.display' },
];

/** Grouped radio list of fonts, each previewed in its own face. Fonts are registered when the picker opens; browsers only download the faces and subsets actually rendered. */
export function FontPicker<Id extends string>({ label, ids, value, onChange, sample, extra }: {
  label: string;
  ids: readonly Id[];
  value: Id;
  onChange: (id: Id) => void;
  sample: string;
  /** Options outside the catalogue, e.g. "Same as app font", shown first. */
  extra?: { id: Id; label: string; family: string }[];
}) {
  useEffect(() => {
    for (const id of ids) if (id in FONTS) ensureFont(id as keyof typeof FONTS);
  }, [ids]);

  const option = (id: Id, name: string, family: string) => (
    <FormControlLabel key={id} value={id} control={<Radio />}
      sx={{ m: 0, minWidth: 0, alignItems: 'center', '& .MuiFormControlLabel-label': { minWidth: 0, flex: 1 } }}
      label={
        <Box sx={{ minWidth: 0 }}>
          {/* Fixed box: fonts swapping in as they load must not shift the options under the pointer. */}
          <Typography sx={{ fontFamily: family, fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.2rem' }, lineHeight: '1.6rem', height: '1.6rem',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} aria-hidden>
            {sample}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ height: '1.25rem', lineHeight: '1.25rem', whiteSpace: 'nowrap' }}>{name}</Typography>
        </Box>
      } />
  );

  return (
    // A plain block: RadioGroup's default wrapping flex column leaves large gaps between the groups.
    <RadioGroup aria-label={label} value={value} onChange={e => onChange(e.target.value as Id)} sx={{ display: 'block' }}>
      {extra && extra.length > 0 && (
        <Box sx={{ mb: 1.5 }}>{extra.map(x => option(x.id, x.label, x.family))}</Box>
      )}
      {GROUPS.map(g => {
        const members = ids.filter(id => id in FONTS && FONTS[id as keyof typeof FONTS].category === g.category);
        if (members.length === 0) return null;
        return (
          <Box key={g.category} sx={{ mb: 1.5 }}>
            <Typography variant="overline" color="text.secondary">{t(g.title)}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
              {members.map(id => {
                const f = FONTS[id as keyof typeof FONTS];
                return option(id, f.label, f.family);
              })}
            </Box>
          </Box>
        );
      })}
    </RadioGroup>
  );
}
