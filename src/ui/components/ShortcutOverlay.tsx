import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import { SHORTCUT_HELP } from '../hooks/shortcuts';
import { t } from '../i18n';

export function ShortcutOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="shortcut-title" maxWidth="xs" fullWidth>
      <DialogTitle id="shortcut-title">{t('shortcuts.title')}</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableBody>
            {SHORTCUT_HELP.map(([key, what]) => (
              <TableRow key={key}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Box component="kbd" sx={{ px: 0.75, py: 0.25, border: 1, borderColor: 'divider', borderRadius: 1, fontFamily: 'inherit', fontWeight: 700 }}>{key}</Box>
                </TableCell>
                <TableCell>{what}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
