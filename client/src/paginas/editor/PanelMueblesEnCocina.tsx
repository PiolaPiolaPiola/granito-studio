import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '../../componentes/BotonIcono'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { MiniaturaMueble } from '../../componentes/MiniaturaMueble'
import { MuestraGranito } from '../../componentes/MuestraGranito'
import type { MaterialAsignado, MuebleEnDiseno } from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import type { Mueble } from '../../dominio/mueble'

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

/**
 * Muebles del diseño en una fila horizontal debajo de la vista 3D: se ven sin bajar en la
 * página. Si no caben, la fila se desplaza de lado. Las flechas cambian el orden en la pared.
 */
export function PanelMueblesEnCocina({ muebles, catalogo, materiales, granitos, seleccionado, onElegir, onQuitar, onMover }: Props) {
  const ordenados = [...muebles].sort((a, b) => a.posicion - b.posicion)
  return (
    <Paper component="section" aria-label="Muebles en el diseño" variant="outlined" sx={{ p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1, px: 0.5, flexWrap: 'wrap' }}>
        <Typography component="h2" variant="h2">Muebles en el diseño ({ordenados.length})</Typography>
        <Typography variant="caption" color="text.secondary">
          {ordenados.length === 0 ? 'Agrega muebles desde el catálogo.' : 'Toca uno (aquí o en el 3D) para cambiar medidas, material o posición. Arrástralo en el 3D para moverlo.'}
        </Typography>
      </Box>
      <Box component="ul" sx={{ display: 'flex', gap: 1, overflowX: 'auto', m: 0, p: 0.5, listStyle: 'none', scrollSnapType: 'x proximity' }}>
        {ordenados.map((m, i) => {
          const mueble = catalogo.get(m.mueble)
          const material = materiales.find((x) => x.pieza === 'mueble' && x.muebleEnDiseno === m._id)
          const granito = material?.granito === undefined ? undefined : granitos.get(material.granito)
          const activo = m._id === seleccionado
          return (
            <Box
              component="li"
              key={m._id}
              sx={{
                flex: '0 0 196px', scrollSnapAlign: 'start', borderRadius: 2, border: 1, overflow: 'hidden', bgcolor: 'background.paper',
                borderColor: activo ? 'primary.main' : 'divider', boxShadow: activo ? '0 0 0 2px rgba(143,112,66,0.3)' : 'none',
              }}
            >
              <ButtonBase
                onClick={() => onElegir(m._id)}
                aria-label={`Seleccionar ${mueble?.nombre ?? 'mueble'} ${String(m.posicion)}`}
                aria-pressed={activo}
                sx={{ display: 'block', width: '100%', textAlign: 'left' }}
              >
                <Box sx={{ position: 'relative' }}>
                  {mueble !== undefined ? <MiniaturaMueble mueble={mueble} sx={{ height: 64 }} /> : <Box sx={{ height: 64, bgcolor: 'action.selected' }} />}
                  <Typography sx={{ position: 'absolute', top: 4, left: 6, fontSize: 12, fontWeight: 700, bgcolor: 'vidrio', borderRadius: 1, px: 0.75 }}>
                    {m.posicion}
                  </Typography>
                  {(granito !== undefined || material?.colorHex !== undefined) && (
                    granito !== undefined ? (
                      <MuestraGranito imagenUrl={granito.imagenUrl} sx={{ position: 'absolute', right: 6, bottom: 6, width: 20, height: 20, borderRadius: '50%', border: '2px solid #fff' }} />
                    ) : (
                      <Box sx={{ position: 'absolute', right: 6, bottom: 6, width: 20, height: 20, borderRadius: '50%', border: '2px solid #fff', bgcolor: material?.colorHex }} />
                    )
                  )}
                </Box>
                <Box sx={{ px: 1, pt: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere', lineHeight: 1.3 }}>{mueble?.nombre ?? 'Mueble inactivo'}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="p">
                    {m.medidasCm !== undefined ? 'Medidas propias' : (granito?.nombre ?? (material?.colorHex !== undefined ? 'Color propio' : 'Material del catálogo'))}
                  </Typography>
                </Box>
              </ButtonBase>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.25 }}>
                <IconButton aria-label="Mover antes" disabled={i === 0} onClick={() => onMover(m._id, -1)} size="small"><ArrowBack fontSize="small" /></IconButton>
                <IconButton aria-label="Quitar del diseño" onClick={() => onQuitar(m._id)} size="small" color="error"><DeleteOutlined fontSize="small" /></IconButton>
                <IconButton aria-label="Mover después" disabled={i === ordenados.length - 1} onClick={() => onMover(m._id, 1)} size="small"><ArrowForward fontSize="small" /></IconButton>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Paper>
  )
}
