import ArrowForward from '@mui/icons-material/ArrowForward'
import DiamondOutlined from '@mui/icons-material/DiamondOutlined'
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useCallback, useState } from 'react'
import { Link as EnlaceRouter } from 'react-router'
import { publicoApi } from '../../api'
import { useAuth } from '../../auth/useAuth'
import { BotonTema } from '../../tema/BotonTema'
import { MuestraGranito } from '../../componentes/MuestraGranito'
import { ETIQUETA_FORMA } from '../../dominio/diseno'
import { ETIQUETA_TIPO_PIEDRA, TIPOS_PIEDRA, type TipoPiedra } from '../../dominio/granito'
import { ETIQUETA_ESPACIO } from '../../dominio/mueble'
import { useConsulta } from '../../hooks/useConsulta'
import { VistaPrevia3D } from '../editor/VistaPrevia3D'
import { useDisenoPublico } from './useDisenoPublico'

const PASOS = [
  ['Elige el espacio', 'Cocina, baño o sala, con una forma típica (en L, en U, con isla) o a la medida.'],
  ['Prueba piedras y acabados', 'Cambia el mesón, el salpicadero, la caída en cascada y el color de los muebles en 3D.'],
  ['Recibe tu cotización', 'Con los metros de piedra de cada pieza y el diseño listo para compartir.'],
] as const

/**
 * Página de inicio PÚBLICA (`/`): lo que ve cualquier visitante antes de iniciar sesión.
 * Muestra los diseños destacados en 3D (los elige un admin), el catálogo de piedras con
 * fotos de trabajos reales y el acceso para el equipo. No muestra precios.
 */
export function Inicio() {
  const { usuario } = useAuth()
  const destacados = useConsulta(useCallback(() => publicoApi.destacados(), []))
  const piedras = useConsulta(useCallback(() => publicoApi.piedras(), []))
  const [elegido, setElegido] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoPiedra | 'todas'>('todas')

  const listaDestacados = destacados.datos ?? []
  const codigo = elegido ?? listaDestacados[0]?.codigoPublico
  const previa = useDisenoPublico(codigo)

  const listaPiedras = piedras.datos ?? []
  const fotos = listaPiedras.flatMap((p) => (p.fotoUrl === undefined ? [] : [{ url: p.fotoUrl, piedra: p.nombre }]))
  // Portada: la foto real de la piedra del mesón del primer diseño destacado (o la primera que haya).
  const idMesonDestacado = previa.vista?.diseno.materiales.find((m) => m.pieza === 'meson' && m.muebleEnDiseno === undefined)?.granito
  const portada = listaPiedras.find((p) => p._id === idMesonDestacado)?.fotoUrl ?? fotos[0]?.url
  const visibles = listaPiedras.filter((p) => tipo === 'todas' || p.tipo === tipo)

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh' }}>
      {/* Barra superior */}
      <Box
        component="header"
        sx={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 2, px: { xs: 2, md: 5 }, py: 1.5, bgcolor: 'vidrio', backdropFilter: 'blur(8px)', borderBottom: 1, borderColor: 'divider' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
          <DiamondOutlined />
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Granito Studio</Typography>
        </Box>
        <Box component="nav" aria-label="Secciones" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, ml: 3 }}>
          <Button color="inherit" href="#disenos">Diseños 3D</Button>
          <Button color="inherit" href="#piedras">Piedras</Button>
          <Button color="inherit" href="#trabajos">Trabajos</Button>
        </Box>
        <Box sx={{ flex: 1 }} />
        <BotonTema />
        {usuario === null ? (
          <Button component={EnlaceRouter} to="/login" variant="contained">Ingresar</Button>
        ) : (
          <Button component={EnlaceRouter} to="/disenos" variant="contained" endIcon={<ArrowForward />}>Ir a la app</Button>
        )}
      </Box>

      {/* Portada */}
      <Box
        component="section"
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, gap: { xs: 3, md: 6 }, alignItems: 'center', px: { xs: 2, md: 5 }, py: { xs: 4, md: 8 }, maxWidth: 1280, mx: 'auto' }}
      >
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 32, md: 46 }, fontWeight: 800, lineHeight: 1.1, mb: 2 }}>
            Mesones de piedra para tu cocina, baño y sala
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 18, mb: 3, maxWidth: 560 }}>
            Mira en 3D cómo queda tu espacio con nuestras piedras de cuarzo, mármol y granito antes de instalarlas.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button href="#disenos" variant="contained" size="large">Ver diseños en 3D</Button>
            <Button href="#piedras" variant="outlined" size="large">Ver piedras</Button>
          </Box>
        </Box>
        {portada !== undefined ? (
          <Box component="img" src={portada} alt="Trabajo terminado del taller" sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 4, boxShadow: '0 20px 50px rgba(38,35,32,0.18)' }} />
        ) : (
          <Box sx={{ width: '100%', aspectRatio: '4 / 3', borderRadius: 4, background: 'var(--lienzo-3d)' }} />
        )}
      </Box>

      {/* Diseños destacados en 3D */}
      {listaDestacados.length > 0 && (
        <Box id="disenos" component="section" sx={{ px: { xs: 2, md: 5 }, py: 5, maxWidth: 1280, mx: 'auto', scrollMarginTop: 72 }}>
          <Typography component="h2" sx={{ fontSize: 28, fontWeight: 700, mb: 0.5 }}>Diseños en 3D</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Gira, acerca y aleja con el mouse o con los dedos.</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {listaDestacados.map((d) => (
              <Chip
                key={d.codigoPublico}
                label={`${d.nombre} · ${ETIQUETA_ESPACIO[d.espacio]}`}
                color={d.codigoPublico === codigo ? 'primary' : 'default'}
                variant={d.codigoPublico === codigo ? 'filled' : 'outlined'}
                onClick={() => setElegido(d.codigoPublico)}
              />
            ))}
          </Box>
          {previa.vista === null ? (
            <Box sx={{ display: 'grid', placeItems: 'center', height: 420 }}>
              {previa.cargando ? <CircularProgress aria-label="Cargando diseño" /> : <Typography color="text.secondary">No se pudo cargar el diseño.</Typography>}
            </Box>
          ) : (
            <>
              <VistaPrevia3D
                key={codigo}
                forma={previa.vista.diseno.forma}
                medidas={previa.vista.diseno.medidasM}
                acabados={previa.vista.diseno.acabados}
                colocaciones={previa.vista.colocaciones}
                desbordados={[]}
                materiales={previa.vista.diseno.materiales}
                granitos={previa.vista.granitos}
                objetos={previa.vista.diseno.objetos}
                entorno={previa.vista.diseno.entorno}
                nombreArchivo={previa.vista.diseno.nombre}
                zoomConRueda={false}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                <Typography color="text.secondary">
                  {ETIQUETA_ESPACIO[previa.vista.diseno.espacio]} · forma {ETIQUETA_FORMA[previa.vista.diseno.forma].toLowerCase()} ·{' '}
                  {previa.vista.diseno.medidasM.ancho} × {previa.vista.diseno.medidasM.fondo} m
                </Typography>
                {codigo !== undefined && (
                  <Button component={EnlaceRouter} to={`/ver/${codigo}`} endIcon={<OpenInNewOutlined />}>
                    Ver detalle
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      )}

      {/* Cómo funciona */}
      <Box component="section" sx={{ px: { xs: 2, md: 5 }, py: 5, maxWidth: 1280, mx: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {PASOS.map(([titulo, texto], i) => (
            <Paper key={titulo} variant="outlined" sx={{ p: 3 }}>
              <Typography sx={{ fontSize: 32, fontWeight: 800, color: 'primary.light', lineHeight: 1 }}>{i + 1}</Typography>
              <Typography component="h3" variant="h3" sx={{ mt: 1, mb: 0.5 }}>{titulo}</Typography>
              <Typography variant="body2" color="text.secondary">{texto}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Catálogo de piedras */}
      <Box id="piedras" component="section" sx={{ px: { xs: 2, md: 5 }, py: 5, maxWidth: 1280, mx: 'auto', scrollMarginTop: 72 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Box sx={{ flex: '1 1 260px' }}>
            <Typography component="h2" sx={{ fontSize: 28, fontWeight: 700 }}>Nuestras piedras</Typography>
            <Typography color="text.secondary">{listaPiedras.length} referencias en cuarzo, mármol y granito.</Typography>
          </Box>
          <ToggleButtonGroup exclusive size="small" value={tipo} onChange={(_, v: TipoPiedra | 'todas' | null) => v !== null && setTipo(v)} aria-label="Tipo de piedra">
            <ToggleButton value="todas">Todas</ToggleButton>
            {TIPOS_PIEDRA.map((t) => <ToggleButton key={t} value={t}>{ETIQUETA_TIPO_PIEDRA[t]}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
          {visibles.map((p) => (
            <Paper key={p._id} variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ position: 'relative' }}>
                {p.fotoUrl !== undefined ? (
                  <Box component="img" src={p.fotoUrl} alt={`Trabajo en ${p.nombre}`} loading="lazy" sx={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }} />
                ) : (
                  <MuestraGranito imagenUrl={p.imagenUrl} alt={`Textura de ${p.nombre}`} sx={{ aspectRatio: '4 / 3', border: 0 }} />
                )}
                <MuestraGranito
                  imagenUrl={p.imagenUrl}
                  alt=""
                  sx={{ position: 'absolute', right: 10, bottom: -18, width: 40, height: 40, borderRadius: '50%', border: '3px solid #fff', boxShadow: 2 }}
                />
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>{p.nombre}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {ETIQUETA_TIPO_PIEDRA[p.tipo]} · {p.acabado === 'brillante' ? 'Brillante' : 'Mate'}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Trabajos realizados */}
      {fotos.length > 1 && (
        <Box id="trabajos" component="section" sx={{ px: { xs: 2, md: 5 }, py: 5, maxWidth: 1280, mx: 'auto', scrollMarginTop: 72 }}>
          <Typography component="h2" sx={{ fontSize: 28, fontWeight: 700, mb: 2 }}>Trabajos realizados</Typography>
          <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 2 }}>
            {fotos.map((f) => (
              <Box key={f.url} component="figure" sx={{ m: 0, mb: 2, breakInside: 'avoid' }}>
                <Box component="img" src={f.url} alt={`Trabajo en ${f.piedra}`} loading="lazy" sx={{ display: 'block', width: '100%', borderRadius: 2 }} />
                <Typography component="figcaption" variant="caption" color="text.secondary">{f.piedra}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box component="footer" sx={{ px: { xs: 2, md: 5 }, py: 4, mt: 4, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          Granito Studio · Mármoles y granitos · Colombia
        </Typography>
        {usuario === null && <Button component={EnlaceRouter} to="/login">Acceso para el equipo</Button>}
      </Box>
    </Box>
  )
}
