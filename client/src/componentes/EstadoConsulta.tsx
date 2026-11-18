import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import type { ErrorApi } from '../api/errores'

interface Props {
  cargando: boolean
  error?: ErrorApi
  onReintentar?: () => void
}

/** Muestra spinner o error de una consulta; no renderiza nada si todo está bien. */
export function EstadoConsulta({ cargando, error, onReintentar }: Props) {
  if (error !== undefined) {
    return (
      <Alert
        severity="error"
        action={onReintentar && <Button color="inherit" onClick={onReintentar}>Reintentar</Button>}
      >
        {error.mensaje}
      </Alert>
    )
  }
  if (cargando) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress aria-label="Cargando" />
      </Box>
    )
  }
  return null
}
