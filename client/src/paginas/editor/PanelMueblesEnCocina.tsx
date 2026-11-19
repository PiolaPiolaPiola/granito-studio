import ArrowDownward from '@mui/icons-material/ArrowDownward'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { MaterialAsignado, MuebleEnDiseno } from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import type { Mueble } from '../../dominio/mueble'
import { MuestraGranito } from '../../componentes/MuestraGranito'

interface Props {
  muebles: MuebleEnDiseno[]
  catalogo: Map<string, Mueble>
  materiales: MaterialAsignado[]
  granitos: Map<string, Granito>
  seleccionado: string | null
  onElegir: (idMuebleEnDiseno: string) => void
  onQuitar: (idMuebleEnDiseno: string) => void
  onMover: (idMuebleEnDiseno: string, delta: -1 | 1) => void
}

export function PanelMueblesEnCocina({ muebles, catalogo, materiales, granitos, seleccionado, onElegir, onQuitar, onMover }: Props) {
  const ordenados = [...muebles].sort((a, b) => a.posicion - b.posicion)
  return (
    <Paper component="section" aria-label="Muebles en el diseño" variant="outlined" sx={{ p: 2 }}>
      <Typography component="h2" variant="h2" sx={{ mb: 1 }}>Muebles en el diseño</Typography>
      {ordenados.length === 0 && <Typography variant="body2" color="text.secondary">Agrega muebles desde el catálogo.</Typography>}
      {ordenados.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Toca un mueble (aquí o en la vista 3D) para cambiar sus medidas, material o posición.
        </Typography>
      )}
      {ordenados.map((m, i) => {
        const mueble = catalogo.get(m.mueble)
        const material = materiales.find((x) => x.pieza === 'mueble' && x.muebleEnDiseno === m._id)
        const granito = material?.granito === undefined ? undefined : granitos.get(material.granito)
        return (
          <Box key={m._id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5, borderRadius: 2, ...(m._id === seleccionado ? { bgcolor: 'rgba(143,112,66,0.12)' } : {}) }}>
            <ButtonBase onClick={() => onElegir(m._id)} sx={{ flex: 1, minWidth: 0, justifyContent: 'flex-start', textAlign: 'left', borderRadius: 2, p: 0.5, gap: 1.5 }} aria-label={`Seleccionar ${mueble?.nombre ?? 'mueble'} ${m.posicion}`} aria-pressed={m._id === seleccionado}>
              {granito !== undefined ? (
                <MuestraGranito imagenUrl={granito.imagenUrl} sx={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
              ) : (
                <Box aria-hidden="true" sx={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: 1, borderColor: 'divider', bgcolor: material?.colorHex ?? '#D8D2C6' }} />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                  {m.posicion}. {mueble?.nombre ?? 'Mueble inactivo'}
                  {m.medidasCm !== undefined && ' · medidas propias'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {granito?.nombre ?? (material?.colorHex !== undefined ? `Color ${material.colorHex}` : 'Sin material · toca para asignar')}
                </Typography>
              </Box>
            </ButtonBase>
            <IconButton aria-label="Mover antes" disabled={i === 0} onClick={() => onMover(m._id, -1)} size="small"><ArrowUpward fontSize="small" /></IconButton>
            <IconButton aria-label="Mover después" disabled={i === ordenados.length - 1} onClick={() => onMover(m._id, 1)} size="small"><ArrowDownward fontSize="small" /></IconButton>
            <IconButton aria-label="Quitar de la cocina" onClick={() => onQuitar(m._id)}><DeleteOutlined /></IconButton>
          </Box>
        )
      })}
    </Paper>
  )
}
