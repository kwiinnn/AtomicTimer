import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useRef, useState } from 'react';
import { toBackupJson } from '../../core/io/backup';
import { toCubicBackup } from '../../core/io/cubicTimer';
import { detectFormat, parseImport } from '../../core/io/detect';
import { mergeImport } from '../../core/io/merge';
import { ImportError, type ImportSummary } from '../../core/io/types';
import { PUZZLE_ORDER, PUZZLES, type PuzzleId } from '../../core/model';
import { dateStamp, saveTextFile } from '../../platform/files';
import { t } from '../i18n';
import { useApp } from '../state/AppContext';

const newId = () => crypto.randomUUID();

export function ImportExportPage() {
  const { storage, settings, updateSettings } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [external, setExternal] = useState<{ text: string; name: string } | null>(null);

  const run = async (text: string, opts: { externalPuzzle?: PuzzleId; externalSessionName?: string } = {}) => {
    setBusy(true);
    try {
      const batch = parseImport(text, opts);
      const merged = mergeImport(await storage.exportAll(), batch, newId);
      await storage.bulkImport(merged.sessions, merged.solves);
      setSummary(merged.summary);
    } catch (e) {
      setError(e instanceof ImportError ? e.message : t('io.unexpected', { message: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (input.current) input.current.value = '';
    if (!file) return;
    const text = await file.text();
    if (detectFormat(text) === 'cubic-external') setExternal({ text, name: file.name.replace(/\.[^.]+$/, '') });
    else await run(text);
  };

  const exportAs = async (kind: 'json' | 'cubic') => {
    const data = await storage.exportAll();
    const stamp = dateStamp();
    if (kind === 'json') await saveTextFile(`atomic-timer-${stamp}.json`, toBackupJson(data, Date.now()), 'application/json');
    else await saveTextFile(`atomic-timer-cubic-${stamp}.csv`, toCubicBackup(data.sessions, data.solves), 'text/csv');
    await updateSettings({ lastBackupAt: Date.now() });
  };

  return (
    <Box component="main" sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>{t('io.title')}</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">{t('io.import')}</Typography>
          <Typography color="text.secondary" sx={{ my: 1 }}>{t('io.importHelp')}</Typography>
          <input ref={input} type="file" hidden data-testid="import-input" accept=".json,.csv,.txt,application/json,text/csv,text/plain"
            onChange={e => void onFile(e.target.files?.[0])} />
          <Button variant="contained" disabled={busy} onClick={() => input.current?.click()}>{t('io.chooseFile')}</Button>
          {busy && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">{t('io.export')}</Typography>
          <Typography color="text.secondary" sx={{ my: 1 }}>{t('io.exportHelp')}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => void exportAs('json')}>{t('io.exportJson')}</Button>
            <Button variant="outlined" onClick={() => void exportAs('cubic')}>{t('io.exportCubic')}</Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('io.lastBackup', { when: settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleString() : t('io.never') })}
          </Typography>
        </Paper>
      </Box>

      {external && (
        <ExternalDialog fileName={external.name} onCancel={() => setExternal(null)}
          onImport={(puzzle, name) => {
            const text = external.text;
            setExternal(null);
            void run(text, { externalPuzzle: puzzle, externalSessionName: name });
          }} />
      )}
      <Dialog open={!!summary} onClose={() => setSummary(null)} aria-labelledby="io-done">
        <DialogTitle id="io-done">{t('io.done')}</DialogTitle>
        <DialogContent>
          {summary && (
            <DialogContentText>
              {t('io.summary', { sessions: summary.sessionsCreated, solves: summary.solvesAdded, dupes: summary.duplicatesSkipped, unsupported: summary.skippedUnsupported })}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setSummary(null)}>{t('common.ok')}</Button></DialogActions>
      </Dialog>
      <Dialog open={!!error} onClose={() => setError(null)} aria-labelledby="io-failed">
        <DialogTitle id="io-failed">{t('io.failed')}</DialogTitle>
        <DialogContent><DialogContentText>{error}</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setError(null)}>{t('common.ok')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

function ExternalDialog({ fileName, onCancel, onImport }: { fileName: string; onCancel: () => void; onImport: (p: PuzzleId, name: string) => void }) {
  const [puzzle, setPuzzle] = useState<PuzzleId>('333');
  const [name, setName] = useState(fileName || 'Imported');
  return (
    <Dialog open onClose={onCancel} aria-labelledby="io-external" fullWidth maxWidth="xs">
      <DialogTitle id="io-external">{t('io.externalTitle')}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DialogContentText>{t('io.externalHelp')}</DialogContentText>
        <TextField label={t('io.sessionName')} value={name} onChange={e => setName(e.target.value)} />
        <FormControl>
          <InputLabel id="io-external-puzzle">{t('session.puzzle')}</InputLabel>
          <Select labelId="io-external-puzzle" label={t('session.puzzle')} value={puzzle} onChange={e => setPuzzle(e.target.value as PuzzleId)}>
            {PUZZLE_ORDER.map(id => <MenuItem key={id} value={id}>{PUZZLES[id].label}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button variant="contained" disabled={!name.trim()} onClick={() => onImport(puzzle, name.trim())}>{t('io.importButton')}</Button>
      </DialogActions>
    </Dialog>
  );
}
