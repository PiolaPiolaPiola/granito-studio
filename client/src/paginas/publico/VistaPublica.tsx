import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { Link as EnlaceRouter, useParams } from 'react-router'
import { EstadoConsulta } from '../../componentes/EstadoConsulta'
import { MiniaturaMueble } from '../../componentes/MiniaturaMueble'
import { MuestraGranito } from '../../componentes/MuestraGranito'
import { buscarMaterial, ETIQUETA_FORMA, ETIQUETA_SALPICADERO } from '../../dominio/diseno'
import { ETIQUETA_TIPO_PIEDRA } from '../../dominio/granito'
import { ETIQUETA_ESPACIO, ETIQUETA_TIPO_MUEBLE } from '../../dominio/mueble'
import { VistaPrevia3D } from '../editor/VistaPrevia3D'
import { useDisenoPublico } from './useDisenoPublico'

/**
 * Página PÚBLICA (sin sesión) de un diseño compartido: `/ver/:codigo`.
 * Solo lectura: la misma vista 3D del editor, sin selección ni arrastre, y la lista de
 * materiales y muebles. No muestra precios.
 */
export function VistaPublica() {
  const { codigo = '' } = useParams()
  const { vista, cargando, error, recargar } = useDisenoPublico(codigo)

  if (vista === null) {
    return (
      <Box sx={{ p: 4, maxWidth: 520, mx: 'auto' }}>
        <EstadoConsulta cargando={cargando} error={error} onReintentar={recargar} />
      </Box>
    )
  }

  const { diseno, granitos } = vista
  const piedra = (pieza: 'meson' | 'salpicadero') => {
    const id = buscarMaterial(diseno.materiales, pieza)?.granito
    return granitos.find((g) => g._id === id)
  }
  const piezasDePiedra = [
    { titulo: 'Mesón', granito: piedra('meson') },
    ...(diseno.acabados.salpicadero === 'ninguno' ? [] : [{ titulo: 'Salpicadero', granito: piedra('salpicadero') }]),
  ]

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Box component="header" sx={{ px: { xs: 2, md: 4 }, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography component={EnlaceRouter} to="/" sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none' }}>Granito Studio</Typography>
      </Box>

      <Box component="main" sx={{ p: { xs: 2, md: 4 }, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' }, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <Box>
            <Typography component="h1" variant="h1">{diseno.nombre}</Typography>
            <Typography color="text.secondary">
              {ETIQUETA_ESPACIO[diseno.espacio]} · forma {ETIQUETA_FORMA[diseno.forma].toLowerCase()} · {diseno.medidasM.ancho} × {diseno.medidasM.fondo} m
            </Typography>
          </Box>
          <VistaPrevia3D
            forma={diseno.forma}
            medidas={diseno.medidasM}
            acabados={diseno.acabados}
            colocaciones={vista.colocaciones}
            desbordados={[]}
            materiales={diseno.materiales}
            granitos={granitos}
            nombreArchivo={diseno.nombre}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="h2" sx={{ mb: 1.5 }}>Piedra</Typography>
            {piezasDePiedra.map(({ titulo, granito }) => (
              <Box key={titulo} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                {granito !== undefined ? (
                  <MuestraGranito imagenUrl={granito.imagenUrl} sx={{ width: 48, height: 48, borderRadius: 2, flexShrink: 0 }} />
                ) : (
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#E4DFD6', flexShrink: 0 }} />
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">{titulo}</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{granito?.nombre ?? 'Por definir'}</Typography>
                  {granito !== undefined && <Typography variant="caption" color="text.secondary">{ETIQUETA_TIPO_PIEDRA[granito.tipo]}</Typography>}
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip size="small" label={`Espesor ${String(diseno.acabados.espesorCm)} cm`} />
              <Chip size="small" label={diseno.acabados.salpicadero === 'ninguno' ? 'Sin salpicadero' : `Salpicadero ${ETIQUETA_SALPICADERO[diseno.acabados.salpicadero].toLowerCase()}`} />
              {diseno.acabados.cascada && <Chip size="small" label="Caída en cascada" />}
            </Box>
            {piedra('meson')?.fotoUrl !== undefined && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Un trabajo nuestro con esta piedra</Typography>
                <Box component="img" src={piedra('meson')?.fotoUrl} alt="Trabajo real con la piedra del mesón" sx={{ display: 'block', width: '100%', borderRadius: 2, mt: 0.5 }} />
              </Box>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="h2" sx={{ mb: 1 }}>Muebles ({vista.colocaciones.length})</Typography>
            {vista.colocaciones.map((c) => (
              <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                <MiniaturaMueble mueble={c.mueble} sx={{ width: 36, height: 36, borderRadius: 1.5, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{c.mueble.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ETIQUETA_TIPO_MUEBLE[c.mueble.tipo]} · {Math.round(c.ancho * 100)} × {Math.round(c.alto * 100)} × {Math.round(c.fondo * 100)} cm
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}
