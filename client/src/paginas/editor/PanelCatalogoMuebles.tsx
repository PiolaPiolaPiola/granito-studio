import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { MiniaturaMueble } from '../../componentes/MiniaturaMueble'
import {
  describirMedidas,
  espacioDe,
  ETIQUETA_ESPACIO,
  ETIQUETA_TIPO_MUEBLE,
  TIPOS_POR_ESPACIO,
  type Espacio,
  type Mueble,
} from '../../dominio/mueble'

interface Props {
  muebles: Mueble[]
  espacio: Espacio
  onAgregar: (mueble: Mueble) => void
}

/** Catálogo del espacio actual, agrupado por tipo. Recibe los datos por props: no sabe de dónde vienen. */
export function PanelCatalogoMuebles({ muebles, espacio, onAgregar }: Props) {
  const delEspacio = muebles.filter((m) => espacioDe(m) === espacio)
  return (
    <Paper component="section" aria-label="Catálogo de muebles" variant="outlined" sx={{ p: 2, maxHeight: 760, overflowY: 'auto' }}>
      <Typography component="h2" variant="h2" sx={{ mb: 1 }}>Muebles · {ETIQUETA_ESPACIO[espacio]}</Typography>
      {delEspacio.length === 0 && (
        <Typography variant="body2" color="text.secondary">No hay muebles para este espacio. Créalos en el catálogo de muebles.</Typography>
      )}
      {TIPOS_POR_ESPACIO[espacio].map((tipo) => {
        const grupo = delEspacio.filter((m) => m.tipo === tipo)
        if (grupo.length === 0) return null
        return (
          <Box key={tipo} sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5 }}>
              {ETIQUETA_TIPO_MUEBLE[tipo]}
            </Typography>
            {grupo.map((m) => (
              <Box key={m._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <MiniaturaMueble mueble={m} sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 2 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{m.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{describirMedidas(m)}</Typography>
                </Box>
                <IconButton color="primary" aria-label={`Agregar ${m.nombre}`} onClick={() => onAgregar(m)}>
                  <AddIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        )
      })}
    </Paper>
  )
}
