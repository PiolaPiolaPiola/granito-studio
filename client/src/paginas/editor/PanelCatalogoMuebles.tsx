import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { describirMedidas, ETIQUETA_TIPO_MUEBLE, TIPOS_MUEBLE, type Mueble } from '../../dominio/mueble'

const COLOR_POR_TIPO = { inferior: '#8C7F6E', superior: '#6C645A', isla: '#5E574F', alacena: '#8D8271' }

interface Props {
  muebles: Mueble[]
  onAgregar: (mueble: Mueble) => void
}

/** Catálogo de muebles agrupado por tipo. Recibe los datos por props: no sabe de dónde vienen. */
export function PanelCatalogoMuebles({ muebles, onAgregar }: Props) {
  return (
    <Paper component="section" aria-label="Catálogo de muebles" variant="outlined" sx={{ p: 2, maxHeight: 760, overflowY: 'auto' }}>
      <Typography component="h2" variant="h2" sx={{ mb: 1 }}>Catálogo de muebles</Typography>
      {TIPOS_MUEBLE.map((tipo) => {
        const grupo = muebles.filter((m) => m.tipo === tipo)
        if (grupo.length === 0) return null
        return (
          <Box key={tipo} sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5 }}>
              {ETIQUETA_TIPO_MUEBLE[tipo]}
            </Typography>
            {grupo.map((m) => (
              <Box key={m._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Box aria-hidden="true" sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: 2, bgcolor: COLOR_POR_TIPO[tipo], color: '#fff', fontWeight: 700, display: 'grid', placeItems: 'center' }}>
                  {m.nombre.charAt(0)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{m.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{describirMedidas(m)}</Typography>
                </Box>
                <IconButton color="primary" aria-label={`Agregar ${m.nombre} a la cocina`} onClick={() => onAgregar(m)}>
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
