import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined'
import LinkOffOutlined from '@mui/icons-material/LinkOffOutlined'
import ShareOutlined from '@mui/icons-material/ShareOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { disenosApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useEsAdmin } from '../../auth/useAuth'
import { useAviso } from '../../componentes/aviso/AvisoContext'

interface Props {
  idDiseno: string
  codigoInicial?: string
  destacadoInicial: boolean
}

const enlaceDe = (codigo: string) => `${window.location.origin}/ver/${codigo}`

/**
 * Compartir el diseño con el cliente: un enlace de solo lectura que se abre sin iniciar
 * sesión (sin precios). Se puede copiar, mandar por WhatsApp o dejar de compartir.
 * El diseño que ve el cliente es el GUARDADO: los cambios sin guardar no se ven.
 */
export function BotonCompartir({ idDiseno, codigoInicial, destacadoInicial }: Props) {
  const aviso = useAviso()
  const esAdmin = useEsAdmin()
  const [destacado, setDestacado] = useState(destacadoInicial)
  const [abierto, setAbierto] = useState(false)
  const [codigo, setCodigo] = useState<string | undefined>(codigoInicial)
  const [trabajando, setTrabajando] = useState(false)

  const ejecutar = async (accion: () => Promise<void>) => {
    setTrabajando(true)
    try {
      await accion()
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    } finally {
      setTrabajando(false)
    }
  }

  const crear = () => ejecutar(async () => setCodigo(await disenosApi.compartir(idDiseno)))
  const cambiarDestacado = (valor: boolean) =>
    ejecutar(async () => {
      const r = await disenosApi.destacar(idDiseno, valor)
      setDestacado(r.destacado)
      if (r.codigoPublico !== undefined) setCodigo(r.codigoPublico)
      aviso.mostrar(valor ? 'Se muestra en la página de inicio' : 'Ya no se muestra en la página de inicio')
    })
  const quitar = () =>
    ejecutar(async () => {
      await disenosApi.dejarDeCompartir(idDiseno)
      setCodigo(undefined)
      setDestacado(false)
      aviso.mostrar('El enlace ya no funciona')
    })
  const copiar = async (enlace: string) => {
    try {
      await navigator.clipboard.writeText(enlace)
      aviso.mostrar('Enlace copiado')
    } catch {
      aviso.mostrar('No se pudo copiar: selecciona el enlace y cópialo a mano', 'info')
    }
  }

  return (
    <>
      <Button variant="outlined" startIcon={<ShareOutlined />} onClick={() => setAbierto(true)}>
        Compartir
      </Button>
      <Dialog open={abierto} onClose={() => setAbierto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Compartir con el cliente</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            El cliente abre el enlace sin iniciar sesión y ve el diseño en 3D, los materiales y los muebles. No ve
            precios ni puede cambiar nada. Muestra la última versión <strong>guardada</strong>.
          </Typography>
          {codigo === undefined ? (
            <Button variant="contained" startIcon={<ShareOutlined />} onClick={() => void crear()} disabled={trabajando}>
              Crear enlace
            </Button>
          ) : (
            <>
              <TextField
                label="Enlace para el cliente"
                value={enlaceDe(codigo)}
                slotProps={{ htmlInput: { readOnly: true }, input: { onFocus: (e) => (e.target as HTMLInputElement).select() } }}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" startIcon={<ContentCopyOutlined />} onClick={() => void copiar(enlaceDe(codigo))}>
                  Copiar
                </Button>
                <Button
                  variant="outlined"
                  component="a"
                  href={`https://wa.me/?text=${encodeURIComponent(`Mira el diseño de tu espacio: ${enlaceDe(codigo)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Enviar por WhatsApp
                </Button>
                <Button variant="outlined" component="a" href={enlaceDe(codigo)} target="_blank" rel="noopener noreferrer">
                  Ver como cliente
                </Button>
              </Box>
            </>
          )}
          {esAdmin && (
            <FormControlLabel
              control={<Switch checked={destacado} disabled={trabajando} onChange={(e) => void cambiarDestacado(e.target.checked)} />}
              label="Mostrar en la página de inicio (para cualquier visitante)"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {codigo !== undefined && (
            <Button color="error" startIcon={<LinkOffOutlined />} onClick={() => void quitar()} disabled={trabajando} sx={{ mr: 'auto' }}>
              Dejar de compartir
            </Button>
          )}
          <Button onClick={() => setAbierto(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
