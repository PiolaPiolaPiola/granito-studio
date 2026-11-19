import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import ErrorRounded from '@mui/icons-material/ErrorRounded'
import InfoRounded from '@mui/icons-material/InfoRounded'
import WarningRounded from '@mui/icons-material/WarningRounded'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { keyframes } from '@mui/material/styles'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AvisoContext, type OpcionesAviso, type Severidad, type ValorAviso } from './AvisoContext'

interface Aviso extends OpcionesAviso {
  id: number
  mensaje: string
  severidad: Severidad
}

/** Los errores se quedan más tiempo: hay que alcanzar a leerlos. */
const DURACION_MS: Record<Severidad, number> = { success: 3500, info: 5000, warning: 6500, error: 9000 }

const ESTILO: Record<Severidad, { color: string; fondo: string; icono: ReactNode; titulo: string }> = {
  success: { color: 'success.main', fondo: 'action.hover', icono: <CheckCircleRounded />, titulo: 'Listo' },
  info: { color: 'primary.main', fondo: 'action.hover', icono: <InfoRounded />, titulo: 'Para tener en cuenta' },
  warning: { color: 'warning.main', fondo: 'action.hover', icono: <WarningRounded />, titulo: 'Atención' },
  error: { color: 'error.main', fondo: 'action.hover', icono: <ErrorRounded />, titulo: 'No se pudo' },
}

const entrar = keyframes`from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: none; }`
const vaciar = keyframes`from { transform: scaleX(1); } to { transform: scaleX(0); }`

/**
 * Avisos propios de la app (toasts): arriba a la derecha, uno debajo del otro, con el color e
 * ícono de cada tipo, una barra que muestra cuánto falta para cerrarse y pausa al pasar el
 * mouse. Los errores se anuncian a los lectores de pantalla de inmediato (`role="alert"`).
 */
export function AvisoProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const contador = useRef(0)

  const cerrar = useCallback((id: number) => setAvisos((lista) => lista.filter((a) => a.id !== id)), [])

  const valor = useMemo<ValorAviso>(
    () => ({
      mostrar: (mensaje, severidad = 'success', opciones = {}) => {
        contador.current += 1
        const nuevo = { id: contador.current, mensaje, severidad, ...opciones }
        // Como máximo 4 a la vez: el más viejo se va.
        setAvisos((lista) => [...lista.slice(-3), nuevo])
      },
    }),
    [],
  )

  return (
    <AvisoContext value={valor}>
      {children}
      <Box
        aria-live="polite"
        sx={{ position: 'fixed', top: 16, right: 16, left: { xs: 16, sm: 'auto' }, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 1.25, width: { sm: 380 } }}
      >
        {avisos.map((a) => <Tarjeta key={a.id} aviso={a} onCerrar={cerrar} />)}
      </Box>
    </AvisoContext>
  )
}

function Tarjeta({ aviso, onCerrar }: { aviso: Aviso; onCerrar: (id: number) => void }) {
  const estilo = ESTILO[aviso.severidad]
  const duracion = DURACION_MS[aviso.severidad]
  const [pausado, setPausado] = useState(false)
  const restante = useRef(duracion)

  useEffect(() => {
    if (pausado) return
    const inicio = Date.now()
    const temporizador = setTimeout(() => onCerrar(aviso.id), restante.current)
    return () => {
      clearTimeout(temporizador)
      restante.current -= Date.now() - inicio
    }
  }, [pausado, onCerrar, aviso.id])

  return (
    <Box
      role={aviso.severidad === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      sx={{
        position: 'relative', overflow: 'hidden', display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 1.75, pr: 1,
        bgcolor: 'background.paper', borderRadius: 3, borderLeft: 4, borderLeftColor: estilo.color,
        boxShadow: '0 10px 30px rgba(38,35,32,0.16), 0 2px 6px rgba(38,35,32,0.08)', animation: `${entrar} 180ms ease-out`,
      }}
    >
      <Box sx={{ color: estilo.color, bgcolor: estilo.fondo, borderRadius: '50%', p: 0.75, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {estilo.icono}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: estilo.color }}>{aviso.titulo ?? estilo.titulo}</Typography>
        <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{aviso.mensaje}</Typography>
        {aviso.detalle !== undefined && aviso.detalle.length > 0 && (
          <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.25, fontSize: 13, color: 'text.secondary' }}>
            {aviso.detalle.map((d) => <li key={d}>{d}</li>)}
          </Box>
        )}
      </Box>
      <Tooltip title="Cerrar aviso">
        <IconButton aria-label="Cerrar aviso" size="small" onClick={() => onCerrar(aviso.id)} sx={{ width: 32, height: 32 }}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, bgcolor: estilo.color, opacity: 0.35, transformOrigin: 'left',
          animation: `${vaciar} ${String(duracion)}ms linear forwards`, animationPlayState: pausado ? 'paused' : 'running',
        }}
      />
    </Box>
  )
}
