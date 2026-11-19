import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { aErrorApi } from '../api/errores'
import { useAviso } from '../componentes/aviso/AvisoContext'
import { analizarSinIa, type ResultadoAnalisis, type TipoAnalisis } from './analisis'
import type { SugerenciaGranito, SugerenciaMueble } from './tipos'

type Props =
  | { tipo: 'mueble'; obtenerArchivo: () => File | undefined; onSugerencia: (s: SugerenciaMueble) => void }
  | { tipo: 'granito'; obtenerArchivo: () => File | undefined; onSugerencia: (s: SugerenciaGranito) => void }

/**
 * "Llenar desde la foto": analiza la foto elegida y propone valores para el formulario.
 * Primero mira los colores en el navegador (sin IA, gratis); si el servidor tiene un
 * proveedor de IA configurado, también le pide que reconozca el objeto.
 */
export function AnalizarFoto(props: Props) {
  const aviso = useAviso()
  const [analizando, setAnalizando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoAnalisis<TipoAnalisis> | null>(null)

  const analizar = async () => {
    const archivo = props.obtenerArchivo()
    if (archivo === undefined) {
      aviso.mostrar('Primero elige una foto', 'info')
      return
    }
    setAnalizando(true)
    try {
      const r = await analizarSinIa(props.tipo, archivo)
      setResultado(r)
      if (props.tipo === 'mueble') props.onSugerencia(r.sugerencia as SugerenciaMueble)
      else props.onSugerencia(r.sugerencia as SugerenciaGranito)
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    } finally {
      setAnalizando(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Tooltip title="Detecta colores y, si hay IA configurada, el tipo de pieza y sus medidas">
        <span>
          <Button variant="outlined" startIcon={<AutoAwesomeOutlined />} onClick={() => void analizar()} disabled={analizando} fullWidth>
            {analizando ? 'Analizando…' : 'Llenar desde la foto'}
          </Button>
        </span>
      </Tooltip>
      {resultado !== null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          {resultado.colores.map((c) => (
            <Tooltip key={c.hex} title={`${c.hex} · ${Math.round(c.peso * 100)} %`}>
              <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: c.hex, border: 1, borderColor: 'divider' }} />
            </Tooltip>
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            {resultado.fuente}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
