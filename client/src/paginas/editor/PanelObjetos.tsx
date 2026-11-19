import AddIcon from '@mui/icons-material/Add'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined'
import Rotate90DegreesCwOutlined from '@mui/icons-material/Rotate90DegreesCwOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { MedidasM, Rotacion } from '../../dominio/diseno'
import type { Espacio } from '../../dominio/mueble'
import { ETIQUETA_OBJETO, OBJETOS_POR_ESPACIO, objetosPorDefecto, type ObjetoReferencia, type TipoObjeto } from '../../dominio/objetos'
import { generarObjectId } from '../../infra/generarId'

interface Props {
  objetos: ObjetoReferencia[]
  espacio: Espacio
  medidas: MedidasM
  /** `obj:<id>` si hay un objeto seleccionado. */
  seleccionado: string | null
  onSeleccionar: (id: string) => void
  onCambiar: (objetos: ObjetoReferencia[]) => void
}

/**
 * Objetos de referencia del diseño (sofá, taza de baño, nevera…): dan escala y contexto para
 * decidir colores. Se arrastran en el 3D como los muebles; aquí se agregan, giran y quitan.
 */
export function PanelObjetos({ objetos, espacio, medidas, seleccionado, onSeleccionar, onCambiar }: Props) {
  const agregar = (tipo: TipoObjeto) => {
    const nuevo: ObjetoReferencia = { _id: generarObjectId(), tipo, ubicacion: { x: 0, z: 0, rotacion: 0 } }
    onCambiar([...objetos, nuevo])
    onSeleccionar(`obj:${nuevo._id}`)
  }
  const girar = (id: string) =>
    onCambiar(objetos.map((o) => (o._id === id ? { ...o, ubicacion: { ...o.ubicacion, rotacion: ((o.ubicacion.rotacion + 90) % 360) as Rotacion } } : o)))
  const quitar = (id: string) => onCambiar(objetos.filter((o) => o._id !== id))

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
        Dan escala para elegir colores. No se cotizan. Arrástralos en el 3D.
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
        {OBJETOS_POR_ESPACIO[espacio].map((tipo) => (
          <Chip key={tipo} size="small" icon={<AddIcon />} label={ETIQUETA_OBJETO[tipo]} onClick={() => agregar(tipo)} variant="outlined" />
        ))}
      </Box>
      {objetos.map((o) => {
        const activo = seleccionado === `obj:${o._id}`
        return (
          <Box key={o._id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, borderRadius: 2, ...(activo ? { bgcolor: 'rgba(143,112,66,0.12)' } : {}) }}>
            <ButtonBase onClick={() => onSeleccionar(`obj:${o._id}`)} sx={{ flex: 1, justifyContent: 'flex-start', p: 0.75, borderRadius: 2 }} aria-pressed={activo}>
              <Typography variant="body2">{ETIQUETA_OBJETO[o.tipo]}</Typography>
            </ButtonBase>
            <IconButton size="small" aria-label={`Girar ${ETIQUETA_OBJETO[o.tipo]}`} onClick={() => girar(o._id)}><Rotate90DegreesCwOutlined fontSize="small" /></IconButton>
            <IconButton size="small" aria-label={`Quitar ${ETIQUETA_OBJETO[o.tipo]}`} onClick={() => quitar(o._id)}><DeleteOutlined fontSize="small" /></IconButton>
          </Box>
        )
      })}
      <Button size="small" startIcon={<RestartAltOutlined />} onClick={() => onCambiar(objetosPorDefecto(espacio, medidas))} sx={{ mt: 0.5 }}>
        Poner los de {espacio === 'bano' ? 'un baño' : espacio === 'sala' ? 'una sala' : 'una cocina'}
      </Button>
    </Box>
  )
}
