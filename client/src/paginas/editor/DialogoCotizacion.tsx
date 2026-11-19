import PrintOutlined from '@mui/icons-material/PrintOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import GlobalStyles from '@mui/material/GlobalStyles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { calcularCotizacion, metrosCuadrados, pesos } from '../../dominio/cotizacion'
import { ETIQUETA_FORMA, ETIQUETA_SALPICADERO, type AcabadosMeson, type FormaCocina, type MaterialAsignado, type MedidasM } from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import { ETIQUETA_ESPACIO, ETIQUETA_TIPO_MUEBLE, type Espacio } from '../../dominio/mueble'
import type { Colocacion } from '../../escena/distribucion'

interface Props {
  abierto: boolean
  onCerrar: () => void
  nombre: string
  espacio: Espacio
  forma: FormaCocina
  medidas: MedidasM
  acabados: AcabadosMeson
  colocaciones: Colocacion[]
  materiales: MaterialAsignado[]
  granitosPorId: Map<string, Granito>
  /** Foto del diseño tomada del lienzo 3D al abrir la cotización. */
  imagen: string | null
}

/**
 * Cotización imprimible: metros de piedra por pieza, totales por piedra (con su precio por m²)
 * y la lista de muebles. "Imprimir" abre el diálogo del navegador, donde se puede guardar
 * como PDF; al imprimir solo se ve la cotización.
 */
export function DialogoCotizacion(props: Props) {
  const { abierto, onCerrar, nombre, espacio, forma, medidas, acabados, colocaciones, materiales, granitosPorId, imagen } = props
  const cotizacion = useMemo(
    () =>
      calcularCotizacion(
        colocaciones.map((c) => ({ nombre: c.mueble.nombre, tipo: c.mueble.tipo, ancho: c.ancho, alto: c.alto, fondo: c.fondo })),
        acabados,
        materiales,
        granitosPorId,
      ),
    [colocaciones, acabados, materiales, granitosPorId],
  )

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="md">
      <GlobalStyles
        styles={{
          '@media print': {
            'body *': { visibility: 'hidden' },
            '#cotizacion, #cotizacion *': { visibility: 'visible' },
            '#cotizacion': { position: 'absolute', inset: 0, padding: 24, background: '#fff' },
          },
        }}
      />
      <DialogTitle>Cotización</DialogTitle>
      <DialogContent>
        <Box id="cotizacion" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h2" component="h2">{nombre}</Typography>
              <Typography variant="body2" color="text.secondary">
                {ETIQUETA_ESPACIO[espacio]} · forma {ETIQUETA_FORMA[forma].toLowerCase()} · {medidas.ancho} × {medidas.fondo} m
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mesón de {acabados.espesorCm} cm · {ETIQUETA_SALPICADERO[acabados.salpicadero].toLowerCase()}
                {acabados.cascada ? ' · con caída en cascada' : ''}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">{dayjs().locale('es').format('D [de] MMMM [de] YYYY')}</Typography>
          </Box>

          {imagen !== null && (
            <Box component="img" src={imagen} alt={`Vista 3D de ${nombre}`} sx={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 2, bgcolor: 'suave' }} />
          )}

          <Typography component="h3" sx={{ fontWeight: 600 }}>Piedra</Typography>
          {cotizacion.grupos.length === 0 && (
            <Typography variant="body2" color="text.secondary">Este diseño todavía no tiene piezas con mesón.</Typography>
          )}
          {cotizacion.grupos.map((g) => (
            <Table key={g.piedra} size="small" aria-label={`Piezas en ${g.piedra}`}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{g.piedra}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, width: 140 }}>Área</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {g.lineas.map((l, i) => (
                  <TableRow key={`${l.descripcion}-${String(i)}`}>
                    <TableCell>{l.descripcion}</TableCell>
                    <TableCell align="right">{metrosCuadrados(l.area)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>
                    Total {g.piedra}
                    {g.granito?.precioM2 !== undefined && ` · ${pesos(g.granito.precioM2)} por m²`}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {metrosCuadrados(g.area)}
                    <br />
                    {g.subtotal === undefined ? 'Sin precio' : pesos(g.subtotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ))}

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1.5 }}>
            <Dato titulo="Piedra total" valor={metrosCuadrados(cotizacion.areaTotal)} />
            <Dato titulo="Canto pulido" valor={`${cotizacion.cantoM.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m`} />
            <Dato titulo="Perforaciones" valor={String(cotizacion.perforaciones)} />
            <Dato titulo="Total piedra" valor={cotizacion.total > 0 ? pesos(cotizacion.total) : '—'} />
          </Box>
          {cotizacion.faltanPrecios && (
            <Alert severity="info">
              Algunas piedras no tienen precio por m². Cárgalo en el catálogo de granitos para que el total salga completo.
            </Alert>
          )}

          <Typography component="h3" sx={{ fontWeight: 600 }}>Muebles ({colocaciones.length})</Typography>
          <Table size="small" aria-label="Muebles del diseño">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Mueble</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Medidas (cm)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {colocaciones.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.mueble.nombre}</TableCell>
                  <TableCell>{ETIQUETA_TIPO_MUEBLE[c.mueble.tipo]}</TableCell>
                  <TableCell align="right">
                    {Math.round(c.ancho * 100)} × {Math.round(c.alto * 100)} × {Math.round(c.fondo * 100)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.secondary">
            Medidas de referencia tomadas del diseño. El valor final se confirma con la visita de medición.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar}>Cerrar</Button>
        <Button variant="contained" startIcon={<PrintOutlined />} onClick={() => window.print()}>Imprimir o guardar PDF</Button>
      </DialogActions>
    </Dialog>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'suave' }}>
      <Typography variant="caption" color="text.secondary">{titulo}</Typography>
      <Typography sx={{ fontWeight: 600 }}>{valor}</Typography>
    </Box>
  )
}
