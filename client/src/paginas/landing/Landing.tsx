import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowForward from '@mui/icons-material/ArrowForward'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { MuestraGranito } from '../../componentes/MuestraGranito'
import { ETIQUETA_ACABADO, ETIQUETA_TIPO_PIEDRA } from '../../dominio/granito'
import type { FormaCocina } from '../../dominio/diseno'
import { puntoDeVista } from '../../escena/camara'
import { distribuir } from '../../escena/distribucion'
import { EscenaCocina } from '../../escena/EscenaCocina'
import { COLORES_MUEBLES, FORMAS_LANDING, MEDIDAS_LANDING, materialesLanding, mueblesLanding, PIEDRAS_LANDING } from './datosLanding'

export function Landing() {
  const { usuario } = useAuth()
  const [forma, setForma] = useState<FormaCocina>('L')
  const [piedraId, setPiedraId] = useState(PIEDRAS_LANDING[0]._id)
  const [colorHex, setColorHex] = useState(COLORES_MUEBLES[0].hex)
  const vista3D = useRef<HTMLDivElement>(null)

  const piedra = PIEDRAS_LANDING.find((p) => p._id === piedraId) ?? PIEDRAS_LANDING[0]
  const muebles = useMemo(() => mueblesLanding(forma), [forma])
  const materiales = useMemo(() => materialesLanding(muebles, piedra, colorHex), [muebles, piedra, colorHex])
  const { colocaciones } = useMemo(() => distribuir(forma, MEDIDAS_LANDING, muebles), [forma, muebles])
  const base = puntoDeVista('inicial', MEDIDAS_LANDING)
  // Un poco más cerca que en el editor: aquí la cocina es la protagonista.
  const camara = { ...base, posicion: base.posicion.map((v) => v * 0.78) as [number, number, number] }

  const probar = (id: string) => {
    setPiedraId(id)
    vista3D.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" component="header" sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
        <Typography sx={{ flex: 1, fontSize: 20, fontWeight: 700, color: 'primary.main' }}>Granito Studio</Typography>
        <Button component={Link} to={usuario ? '/disenos' : '/login'} variant="contained">
          {usuario ? 'Ir a mi espacio' : 'Ingresar'}
        </Button>
      </Container>

      <Container maxWidth="lg" component="main">
        <Box sx={{ display: 'grid', gap: 4, py: { xs: 3, md: 6 }, gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, alignItems: 'center' }}>
          <Box>
            <Typography component="h1" sx={{ fontSize: { xs: 34, md: 44 }, fontWeight: 700, lineHeight: 1.1, mb: 2 }}>
              Mira tu cocina en piedra antes de construirla
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 18, mb: 3 }}>
              Arma una cocina en 3D, elige el mármol o granito de cada pieza y compara combinaciones al instante.
              Esta es una vista previa: gira la cocina y cambia la piedra.
            </Typography>
            <Button component="a" href="#marmoles" variant="outlined" size="large">Ver mármoles disponibles</Button>
          </Box>

          <Box ref={vista3D}>
            <Box
              sx={{ height: { xs: 340, md: 460 }, borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', background: 'linear-gradient(145deg, #EDEAE4 0%, #D8D4CC 100%)' }}
            >
              <Canvas shadows="percentage" camera={{ position: camara.posicion, fov: 45, near: 0.1, far: 100 }} aria-label="Cocina en 3D, arrastra para girar">
                <EscenaCocina forma={forma} medidas={MEDIDAS_LANDING} colocaciones={colocaciones} materiales={materiales} granitos={PIEDRAS_LANDING} />
                <OrbitControls autoRotate autoRotateSpeed={1.4} enableZoom={false} enablePan={false} target={camara.objetivo} maxPolarAngle={Math.PI / 2 - 0.05} />
              </Canvas>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mt: 2 }}>
              <ToggleButtonGroup exclusive size="small" value={forma} onChange={(_, v: FormaCocina | null) => v !== null && setForma(v)} aria-label="Forma de la cocina">
                {FORMAS_LANDING.map((f) => (
                  <ToggleButton key={f.forma} value={f.forma} sx={{ minHeight: 40, px: 2, '&.Mui-selected': { bgcolor: 'rgba(143,112,66,0.16)', color: 'primary.dark' } }}>
                    {f.etiqueta}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Box role="group" aria-label="Color de los muebles" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {COLORES_MUEBLES.map((c) => (
                  <ButtonBase
                    key={c.hex}
                    aria-label={c.nombre}
                    aria-pressed={c.hex === colorHex}
                    onClick={() => setColorHex(c.hex)}
                    sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: c.hex, border: 1, borderColor: 'divider', outline: c.hex === colorHex ? '3px solid' : 'none', outlineColor: 'primary.main', outlineOffset: 2 }}
                  />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">Mesón: <strong>{piedra.nombre}</strong></Typography>
            </Box>
          </Box>
        </Box>

        <Box component="section" id="marmoles" aria-labelledby="titulo-marmoles" sx={{ py: 5 }}>
          <Carrusel piedraId={piedraId} onProbar={probar} />
        </Box>

        <Box component="section" sx={{ py: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
          {[
            ['1 · Elige la forma', 'Lineal, en L, en U o con isla, con las medidas reales de tu espacio.'],
            ['2 · Coloca los muebles', 'Del catálogo a la cocina: se acomodan por posición, pared por pared.'],
            ['3 · Prueba la piedra', 'Mesón, salpicadero y gabinetes con granito, mármol, cuarzo o un color liso.'],
          ].map(([titulo, texto]) => (
            <Box key={titulo}>
              <Typography component="h3" variant="h3" sx={{ mb: 0.5 }}>{titulo}</Typography>
              <Typography color="text.secondary">{texto}</Typography>
            </Box>
          ))}
        </Box>
      </Container>

      <Box component="footer" sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">Granito Studio · Granitos y Mármoles · Colombia</Typography>
      </Box>
    </Box>
  )
}

function Carrusel({ piedraId, onProbar }: { piedraId: string; onProbar: (id: string) => void }) {
  const pista = useRef<HTMLDivElement>(null)
  const mover = (dir: -1 | 1) => pista.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography id="titulo-marmoles" component="h2" sx={{ flex: 1, fontSize: 26, fontWeight: 700 }}>Mármoles y granitos disponibles</Typography>
        <IconButton aria-label="Anterior" onClick={() => mover(-1)}><ArrowBack /></IconButton>
        <IconButton aria-label="Siguiente" onClick={() => mover(1)}><ArrowForward /></IconButton>
      </Box>
      <Box
        ref={pista}
        tabIndex={0}
        role="list"
        aria-label="Carrusel de piedras"
        sx={{ display: 'flex', gap: 2, overflowX: 'auto', scrollSnapType: 'x mandatory', pb: 1.5, '& > *': { scrollSnapAlign: 'start' } }}
      >
        {PIEDRAS_LANDING.map((p) => (
          <Box key={p._id} role="listitem" sx={{ flex: '0 0 250px', bgcolor: 'background.paper', border: 1, borderColor: p._id === piedraId ? 'primary.main' : 'divider', borderRadius: 3, p: 2 }}>
            <MuestraGranito imagenUrl={p.imagenUrl} alt={`Textura de ${p.nombre}`} sx={{ aspectRatio: '4 / 3', borderRadius: 2, mb: 1.5 }} />
            <Typography component="h3" variant="h3" sx={{ mb: 1 }}>{p.nombre}</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
              <Chip size="small" label={ETIQUETA_TIPO_PIEDRA[p.tipo]} sx={{ bgcolor: '#EFEAE2' }} />
              <Chip size="small" variant="outlined" label={ETIQUETA_ACABADO[p.acabado]} />
            </Box>
            <Button fullWidth variant={p._id === piedraId ? 'contained' : 'outlined'} onClick={() => onProbar(p._id)}>
              {p._id === piedraId ? 'En la cocina' : 'Probar en la cocina'}
            </Button>
          </Box>
        ))}
      </Box>
    </>
  )
}
