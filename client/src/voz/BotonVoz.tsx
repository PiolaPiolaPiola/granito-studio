import KeyboardVoiceOutlined from '@mui/icons-material/KeyboardVoiceOutlined'
import StopCircleOutlined from '@mui/icons-material/StopCircleOutlined'
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useState } from 'react'
import { iaApi } from '../api'
import { aErrorApi } from '../api/errores'
import type { EntradaDiseno } from '../dominio/diseno'
import type { Granito } from '../dominio/granito'
import { espacioDe, type Mueble } from '../dominio/mueble'
import type { AccionVoz, ContextoComando, EstadoIa } from '../ia/tipos'
import { aplicarAcciones } from './aplicarAcciones'
import { interpretarLocal } from './interpretarLocal'
import { useDictado } from './useDictado'

interface Props {
  obtenerDiseno: () => EntradaDiseno
  catalogo: Mueble[]
  granitos: Granito[]
  onAplicar: (diseno: EntradaDiseno) => void
}

const EJEMPLOS = [
  'Agrega dos gabinetes inferiores de 60 y un cajonero',
  'Cocina en L, el espacio mide 3,5 por 2,8',
  'Mesón en negro estelar con salpicadero completo',
  'Con cascada, espesor 4, muebles color nogal',
]

/**
 * Crear y cambiar el diseño hablando (o escribiendo, o subiendo una nota de voz).
 * Primero se intenta con las reglas locales; si quedan partes sin entender y el servidor
 * tiene IA, se le pregunta a la IA por la frase completa.
 */
export function BotonVoz({ obtenerDiseno, catalogo, granitos, onAplicar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [resultado, setResultado] = useState<{ hechas: string[]; fallidas: string[]; fuente: string } | null>(null)
  const [estadoIa, setEstadoIa] = useState<EstadoIa | null>(null)
  const dictado = useDictado(useCallback((t: string) => setTexto((anterior) => (anterior ? `${anterior}, ${t}` : t)), []))

  useEffect(() => {
    if (abierto) iaApi.estado().then(setEstadoIa).catch(() => setEstadoIa(null))
  }, [abierto])

  const contexto = (): ContextoComando => {
    const { espacio } = obtenerDiseno()
    const delEspacio = catalogo.filter((m) => espacioDe(m) === espacio)
    return {
      espacio,
      muebles: (delEspacio.length > 0 ? delEspacio : catalogo).map((m) => m.nombre).slice(0, 80),
      piedras: granitos.map((g) => g.nombre).slice(0, 60),
    }
  }

  const aplicar = async () => {
    if (texto.trim().length < 2) return
    setTrabajando(true)
    try {
      const ctx = contexto()
      const local = interpretarLocal(texto, ctx)
      let acciones: AccionVoz[] = local.acciones
      let fuente = 'Entendido sin IA'
      if (local.sinEntender.length > 0 && estadoIa?.disponible === true) {
        try {
          const respuesta = await iaApi.interpretar(texto, ctx)
          if (respuesta.acciones.length > 0) {
            acciones = respuesta.acciones
            fuente = `Entendido con IA (${respuesta.proveedor}${respuesta.desdeCache ? ', respuesta guardada' : ''})`
          }
        } catch (e) {
          fuente = `Sin IA: ${aErrorApi(e).mensaje}`
        }
      }
      const { diseno, hechas, fallidas } = aplicarAcciones(obtenerDiseno(), acciones, catalogo, granitos)
      const noEntendidas = acciones === local.acciones ? local.sinEntender.map((s) => `No entendí: "${s}"`) : []
      if (hechas.length > 0) onAplicar(diseno)
      setResultado({ hechas, fallidas: [...fallidas, ...noEntendidas], fuente })
    } finally {
      setTrabajando(false)
    }
  }

  const subirAudio = async (archivo: File | undefined) => {
    if (archivo === undefined) return
    setTrabajando(true)
    try {
      const { texto: transcrito } = await iaApi.transcribir(archivo, archivo.name)
      setTexto(transcrito)
    } catch (e) {
      setResultado({ hechas: [], fallidas: [aErrorApi(e).mensaje], fuente: 'Transcripción' })
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <>
      <Button variant="outlined" startIcon={<KeyboardVoiceOutlined />} onClick={() => setAbierto(true)}>
        Voz
      </Button>
      <Dialog open={abierto} onClose={() => setAbierto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Diseñar hablando</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Di o escribe lo que quieres. Por ejemplo: {EJEMPLOS.map((e) => `«${e}»`).join(' · ')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {dictado.soportado ? (
              <Button
                variant={dictado.escuchando ? 'contained' : 'outlined'}
                color={dictado.escuchando ? 'error' : 'primary'}
                startIcon={dictado.escuchando ? <StopCircleOutlined /> : <KeyboardVoiceOutlined />}
                onClick={dictado.escuchando ? dictado.detener : dictado.empezar}
              >
                {dictado.escuchando ? 'Escuchando… (toca para parar)' : 'Hablar'}
              </Button>
            ) : (
              <Typography variant="caption" color="text.secondary">Este navegador no permite dictar: usa Chrome o Edge, o escribe.</Typography>
            )}
            {estadoIa?.transcribeAudio === true && (
              <Button component="label" variant="outlined" startIcon={<UploadFileOutlined />} disabled={trabajando}>
                Subir nota de voz
                <input type="file" accept="audio/*" hidden onChange={(e) => void subirAudio(e.target.files?.[0])} />
              </Button>
            )}
          </Box>
          {dictado.escuchando && dictado.parcial !== '' && <Typography variant="body2">… {dictado.parcial}</Typography>}
          {dictado.error !== null && <Alert severity="warning">{dictado.error}</Alert>}

          <TextField
            label="Lo que quieres hacer"
            multiline
            minRows={2}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          {resultado !== null && (
            <Box>
              <Typography variant="caption" color="text.secondary">{resultado.fuente}</Typography>
              {resultado.hechas.length > 0 && (
                <Alert severity="success" sx={{ mt: 0.5 }}>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>{resultado.hechas.map((h) => <li key={h}>{h}</li>)}</ul>
                </Alert>
              )}
              {resultado.fallidas.length > 0 && (
                <Alert severity="warning" sx={{ mt: 0.5 }}>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>{resultado.fallidas.map((f) => <li key={f}>{f}</li>)}</ul>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setTexto(''); setResultado(null) }}>Limpiar</Button>
          <Button onClick={() => setAbierto(false)}>Cerrar</Button>
          <Button variant="contained" onClick={() => void aplicar()} disabled={trabajando || texto.trim().length < 2}>
            {trabajando ? 'Aplicando…' : 'Aplicar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
