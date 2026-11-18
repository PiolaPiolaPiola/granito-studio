import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { useMemo, useState, type ReactNode } from 'react'
import { AvisoContext, type Severidad, type ValorAviso } from './AvisoContext'

interface Aviso {
  mensaje: string
  severidad: Severidad
}

/** Mensajes breves ("Diseño guardado") en una sola esquina de la app. */
export function AvisoProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [abierto, setAbierto] = useState(false)

  const valor = useMemo<ValorAviso>(
    () => ({
      mostrar: (mensaje, severidad = 'success') => {
        setAviso({ mensaje, severidad })
        setAbierto(true)
      },
    }),
    [],
  )

  return (
    <AvisoContext value={valor}>
      {children}
      <Snackbar
        open={abierto}
        autoHideDuration={5000}
        onClose={(_, motivo) => motivo !== 'clickaway' && setAbierto(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={aviso?.severidad ?? 'success'} variant="filled" onClose={() => setAbierto(false)}>
          {aviso?.mensaje}
        </Alert>
      </Snackbar>
    </AvisoContext>
  )
}
