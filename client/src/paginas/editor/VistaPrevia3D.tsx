import AutorenewOutlined from '@mui/icons-material/AutorenewOutlined'
import PhotoOutlined from '@mui/icons-material/PhotoOutlined'
import StraightenOutlined from '@mui/icons-material/StraightenOutlined'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined'
import ViewInArOutlined from '@mui/icons-material/ViewInArOutlined'
import ZoomInOutlined from '@mui/icons-material/ZoomInOutlined'
import ZoomOutOutlined from '@mui/icons-material/ZoomOutOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { Canvas } from '@react-three/fiber'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Scene } from 'three'
import type { AcabadosMeson, Entorno, FormaCocina, MaterialAsignado, MedidasM } from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import type { ObjetoReferencia } from '../../dominio/objetos'
import { puntoDeVista, type ComandoCamara, type Vista } from '../../escena/camara'
import { ControlCamara } from '../../escena/ControlCamara'
import type { Colocacion } from '../../escena/distribucion'
import { EscenaCocina } from '../../escena/EscenaCocina'
import { descargarImagen, descargarModelo3D } from '../../exportar/exportar'

interface Props {
  forma: FormaCocina
  medidas: MedidasM
  acabados: AcabadosMeson
  /** Distribución ya calculada por el editor (la comparten la cotización y el panel de la pieza). */
  colocaciones: Colocacion[]
  desbordados: Colocacion[]
  materiales: MaterialAsignado[]
  granitos: Granito[]
  objetos?: ObjetoReferencia[]
  entorno?: Entorno
  /** Foto del espacio real: se puede ver el diseño encima. */
  fondoUrl?: string
  nombreArchivo: string
  /** Sin estos tres la vista es de solo lectura (enlace público). */
  seleccionado?: string | null
  onSeleccionar?: (id: string) => void
  onMover?: (id: string, x: number, z: number) => void
  /** false en la página de inicio: la rueda mueve la página (el zoom queda en los botones). */
  zoomConRueda?: boolean
  /** El lienzo, para que la cotización pueda incluir una foto del diseño. */
  onLienzo?: (lienzo: HTMLCanvasElement) => void
}

export function VistaPrevia3D(props: Props) {
  const { forma, medidas, acabados, colocaciones, desbordados, materiales, granitos, nombreArchivo, seleccionado, onSeleccionar, onMover, onLienzo, zoomConRueda = true, objetos, fondoUrl, entorno } = props
  const [cotas, setCotas] = useState(onMover !== undefined)
  // Arranca en el modelo 3D; la foto de fondo se activa con su botón.
  const [sobreFoto, setSobreFoto] = useState(false)
  const verFoto = sobreFoto && fondoUrl !== undefined
  const [vista, setVista] = useState<Vista>('frontal')
  const [comando, setComando] = useState<ComandoCamara | null>(null)
  const [autoRotar, setAutoRotar] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const lienzo = useRef<HTMLCanvasElement | null>(null)
  const escena = useRef<Scene | null>(null)
  const contador = useRef(0)

  const inicial = useMemo(() => puntoDeVista('inicial', medidas), [medidas])

  const enviar = useCallback((orden: DistributivoOmit) => {
    contador.current += 1
    setComando({ ...orden, id: contador.current } as ComandoCamara)
  }, [])

  const alternarVista = () => {
    const siguiente: Vista = vista === 'frontal' ? 'superior' : 'frontal'
    setVista(siguiente)
    enviar({ tipo: 'vista', vista: siguiente })
  }

  const nombre = nombreArchivo || 'diseno'

  return (
    <Box
      component="section"
      aria-label="Vista 3D"
      sx={{
        position: 'relative', height: 'max(440px, calc(100dvh - 330px))', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', touchAction: 'none',
        background: verFoto ? `center / cover no-repeat url("${fondoUrl}")` : 'linear-gradient(145deg, #EDEAE4 0%, #D8D4CC 100%)',
      }}
    >
      <Canvas
        shadows="percentage"
        camera={{ position: inicial.posicion, fov: 45, near: 0.1, far: 100 }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl, scene }) => {
          lienzo.current = gl.domElement
          escena.current = scene
          onLienzo?.(gl.domElement)
        }}
        aria-label="Diseño en 3D"
      >
        <EscenaCocina
          forma={forma}
          medidas={medidas}
          acabados={acabados}
          colocaciones={colocaciones}
          materiales={materiales}
          granitos={granitos}
          seleccionado={seleccionado ?? null}
          onSeleccionar={onSeleccionar}
          onMover={onMover}
          onArrastrando={setArrastrando}
          objetos={objetos}
          mostrarCotas={cotas}
          sobreFoto={verFoto}
          entorno={entorno}
        />
        <ControlCamara comando={comando} medidas={medidas} autoRotar={autoRotar} bloqueada={arrastrando} zoomConRueda={zoomConRueda} />
      </Canvas>

      <Typography
        variant="caption"
        sx={{ position: 'absolute', top: 12, left: 12, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.85)', color: 'text.primary' }}
      >
        {medidas.ancho} × {medidas.fondo} m · {colocaciones.length} muebles
        {onMover !== undefined && ' · arrastra un mueble para moverlo'}
      </Typography>
      {desbordados.length > 0 && (
        <Alert severity="warning" sx={{ position: 'absolute', top: 12, right: 12, maxWidth: 320 }}>
          {desbordados.length === 1 ? '1 mueble no cabe' : `${desbordados.length} muebles no caben`} en el espacio. Agranda las medidas, mueve o quita alguno.
        </Alert>
      )}

      <Paper
        role="toolbar"
        aria-label="Controles de cámara"
        elevation={3}
        sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 0.25, px: 1, borderRadius: 6, maxWidth: 'calc(100% - 16px)', overflowX: 'auto' }}
      >
        <ToggleButton value="rotar" selected={autoRotar} onChange={() => setAutoRotar((v) => !v)} aria-label="Rotar vista automáticamente" sx={{ border: 0, borderRadius: '50%', width: 44, height: 44 }}>
          <AutorenewOutlined />
        </ToggleButton>
        <IconButton aria-label="Acercar" onClick={() => enviar({ tipo: 'zoom', factor: 0.8 })}><ZoomInOutlined /></IconButton>
        <IconButton aria-label="Alejar" onClick={() => enviar({ tipo: 'zoom', factor: 1.25 })}><ZoomOutOutlined /></IconButton>
        <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5 }} />
        <Button onClick={alternarVista} sx={{ minWidth: 96, minHeight: 44, borderRadius: 6 }}>
          {vista === 'frontal' ? 'Frontal' : 'Superior'}
        </Button>
        <IconButton aria-label="Restablecer cámara" onClick={() => { setVista('frontal'); enviar({ tipo: 'reiniciar' }) }}><RestartAltOutlined /></IconButton>
        <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5 }} />
        <Tooltip title={cotas ? 'Ocultar medidas' : 'Mostrar medidas del espacio'}>
          <ToggleButton value="cotas" selected={cotas} onChange={() => setCotas((v) => !v)} aria-label="Medidas del espacio" sx={{ border: 0, borderRadius: '50%', width: 44, height: 44 }}>
            <StraightenOutlined />
          </ToggleButton>
        </Tooltip>
        {fondoUrl !== undefined && (
          <Tooltip title={verFoto ? 'Ver el espacio en 3D' : 'Ver el diseño sobre la foto del espacio'}>
            <ToggleButton value="foto" selected={verFoto} onChange={() => setSobreFoto((v) => !v)} aria-label="Ver sobre la foto" sx={{ border: 0, borderRadius: '50%', width: 44, height: 44 }}>
              <PhotoOutlined />
            </ToggleButton>
          </Tooltip>
        )}
        <Tooltip title="Descargar imagen (PNG)">
          <IconButton aria-label="Descargar imagen" onClick={() => lienzo.current && void descargarImagen(lienzo.current, nombre, verFoto ? fondoUrl : undefined)}><ImageOutlined /></IconButton>
        </Tooltip>
        <Tooltip title="Descargar modelo 3D (.glb)">
          <IconButton aria-label="Descargar modelo 3D" onClick={() => escena.current && void descargarModelo3D(escena.current, nombre)}><ViewInArOutlined /></IconButton>
        </Tooltip>
      </Paper>
    </Box>
  )
}

type DistributivoOmit = ComandoCamara extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never
