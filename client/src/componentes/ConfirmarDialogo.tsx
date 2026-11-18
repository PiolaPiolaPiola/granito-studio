import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

interface Props {
  abierto: boolean
  titulo: string
  mensaje: string
  textoConfirmar?: string
  ocupado?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmarDialogo({ abierto, titulo, mensaje, textoConfirmar = 'Eliminar', ocupado, onConfirmar, onCancelar }: Props) {
  return (
    <Dialog open={abierto} onClose={onCancelar} role="alertdialog" maxWidth="xs" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{mensaje}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancelar}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={onConfirmar} disabled={ocupado}>
          {textoConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
