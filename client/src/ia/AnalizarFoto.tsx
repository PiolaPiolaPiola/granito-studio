import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { iaApi } from '../api'
import { aErrorApi } from '../api/errores'
import { useAviso } from '../componentes/aviso/AvisoContext'
import { analizarSinIa } from './analisis'
import type { ColorContado } from './colores'
import { reducirImagen } from './reducirImagen'
import type { SugerenciaGranito, SugerenciaMueble } from './tipos'

type Props =
  | { tipo: 'mueble'; obtenerArchivo: () => File | undefined; onSugerencia: (s: SugerenciaMueble) => void }
  | { tipo: 'granito'; obtenerArchivo: () => File | undefined; onSugerencia: (s: SugerenciaGranito) => void }

/**
 * "Llenar desde la foto": propone valores para el formulario a partir de la foto elegida.
 * 1. Siempre: colores dominantes calculados en el navegador (sin IA, gratis, sin enviar nada).
 * 2. Si el servidor tiene IA configurada: la foto (reducida) se envía para reconocer el tipo,
 *    el material y las medidas. Lo que diga la IA completa o reemplaza lo local.
 */
export function AnalizarFoto(props: Props) {
  const aviso = useAviso()
  const [analizando, setAnalizando] = useState(false)
  const [resultado, setResultado] = useState<{ colores: ColorContado[]; fuente: string } | null>(null)

  const analizar = async () => {
    const archivo = props.obtenerArchivo()
    if (archivo === undefined) {
      aviso.mostrar('Primero elige una foto', 'info')
      return
    }
    setAnalizando(true)
    try {
      const local = await analizarSinIa(props.tipo, archivo)
      let sugerencia: SugerenciaMueble | SugerenciaGranito = local.sugerencia
      let fuente = local.fuente

      const estado = await iaApi.estado().catch(() => null)
      if (estado?.disponible === true) {
        try {
          const respuesta = await iaApi.analizarFoto(props.tipo, await reducirImagen(archivo))
          sugerencia = { ...local.sugerencia, ...sinVacios(respuesta.sugerencia) }
          fuente = `IA: ${respuesta.proveedor}${respuesta.desdeCache ? ' (respuesta guardada)' : ''} + colores del navegador`
        } catch (e) {
          aviso.mostrar(`${aErrorApi(e).mensaje} Se usaron solo los colores.`, 'info')
        }
      }

      setResultado({ colores: local.colores, fuente })
      if (props.tipo === 'mueble') props.onSugerencia(sugerencia as SugerenciaMueble)
      else props.onSugerencia(sugerencia as SugerenciaGranito)
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    } finally {
      setAnalizando(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Tooltip title="Detecta los colores en tu navegador. Si el servidor tiene IA configurada, también envía la foto (reducida) para reconocer tipo, material y medidas.">
        <span>
          <Button variant="outlined" startIcon={<AutoAwesomeOutlined />} onClick={() => void analizar()} disabled={analizando} fullWidth>
            {analizando ? 'Analizando…' : 'Llenar desde la foto'}
          </Button>
        </span>
      </Tooltip>
      {resultado !== null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          {resultado.colores.map((c) => (
            <Tooltip key={c.hex} title={`${c.hex} · ${String(Math.round(c.peso * 100))} %`}>
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

/** Quita las claves sin valor para que no borren lo que ya calculó el análisis local. */
function sinVacios<T extends object>(objeto: T): Partial<T> {
  return Object.fromEntries(Object.entries(objeto).filter(([, v]) => v !== undefined && v !== null && v !== '')) as Partial<T>
}
