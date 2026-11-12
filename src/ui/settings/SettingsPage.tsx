import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import type { Settings } from '../../core/settings';
import type { DnfRule } from '../../core/stats/average';
import { t, type MessageKey } from '../i18n';
import { useApp } from '../state/AppContext';

type BoolKey = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ mb: 2 }}>
      <List subheader={<ListSubheader disableSticky sx={{ bgcolor: 'transparent', color: 'primary.main', fontWeight: 700 }}>{title}</ListSubheader>}>
        {children}
      </List>
    </Paper>
  );
}

export function SettingsPage() {
  const { settings, updateSettings, setView } = useApp();
  const toggle = (key: BoolKey, label: MessageKey, help?: MessageKey) => (
    <ListItem>
      <FormControlLabel sx={{ width: '100%', mr: 0, justifyContent: 'space-between', ml: 0 }} labelPlacement="start"
        label={<Box><Typography>{t(label)}</Typography>{help && <Typography variant="body2" color="text.secondary">{t(help)}</Typography>}</Box>}
        control={<Switch checked={settings[key]} onChange={e => void updateSettings({ [key]: e.target.checked })}
          slotProps={{ input: { role: 'switch', 'aria-label': t(label) } }} />} />
    </ListItem>
  );
  const slider = (label: MessageKey, value: number, min: number, max: number, stepSize: number, onChange: (v: number) => void, fmt: (v: number) => string) => (
    <ListItem sx={{ display: 'block' }}>
      <Typography id={`s-${label}`}>{t(label)}: <b>{fmt(value)}</b></Typography>
      <Slider aria-labelledby={`s-${label}`} value={value} min={min} max={max} step={stepSize} valueLabelDisplay="auto"
        valueLabelFormat={fmt} onChange={(_, v) => onChange(v as number)} />
    </ListItem>
  );

  return (
    <Box component="main" sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 700 }}>{t('settings.title')}</Typography>
        <Section title={t('settings.timer')}>
          {slider('settings.holdMs', settings.holdMs, 0, 1000, 50, v => void updateSettings({ holdMs: v }), v => `${v} ms`)}
          {toggle('thousandths', 'settings.thousandths')}
          {toggle('manualEntry', 'settings.manualEntry')}
        </Section>
        <Section title={t('settings.inspection')}>
          {toggle('inspection', 'settings.inspectionOn', 'settings.inspectionHelp')}
          {toggle('inspectionAlerts', 'settings.inspectionAlerts')}
        </Section>
        <Section title={t('settings.statistics')}>
          <ListItem sx={{ justifyContent: 'space-between', gap: 2 }}>
            <Typography id="trim-label">{t('settings.trimPct')}</Typography>
            <Select size="small" aria-labelledby="trim-label" value={settings.trimPct} onChange={e => void updateSettings({ trimPct: Number(e.target.value) })}>
              {[0, 5, 10].map(v => <MenuItem key={v} value={v}>{v}%</MenuItem>)}
            </Select>
          </ListItem>
          <ListItem sx={{ display: 'block' }}>
            <Typography id="dnf-label">{t('settings.dnfRule')}</Typography>
            <RadioGroup aria-labelledby="dnf-label" value={settings.dnfRule} onChange={e => void updateSettings({ dnfRule: e.target.value as DnfRule })}>
              <FormControlLabel value="wca" control={<Radio />} label={t('settings.dnfWca')} />
              <FormControlLabel value="strict" control={<Radio />} label={t('settings.dnfStrict')} />
            </RadioGroup>
          </ListItem>
          {toggle('showSessionStats', 'settings.sessionStats')}
          {toggle('showTodayStats', 'settings.todayStats')}
          {toggle('discreteGraph', 'settings.discreteGraph')}
        </Section>
        <Section title={t('settings.appearance')}>
          {slider('settings.timerText', settings.timerTextScale, 0.5, 2, 0.1, v => void updateSettings({ timerTextScale: v }), v => `${Math.round(v * 100)}%`)}
          {slider('settings.scrambleText', settings.scrambleTextScale, 0.5, 2, 0.1, v => void updateSettings({ scrambleTextScale: v }), v => `${Math.round(v * 100)}%`)}
          <ListItem><Button onClick={() => setView('theme')}>{t('settings.theme')}</Button></ListItem>
        </Section>
        <Section title={t('settings.backup')}>
          {toggle('backupReminder', 'settings.backupReminder')}
        </Section>
      </Box>
    </Box>
  );
}
