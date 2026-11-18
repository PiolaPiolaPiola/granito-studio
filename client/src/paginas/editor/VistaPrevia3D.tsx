import AutorenewOutlined from '@mui/icons-material/AutorenewOutlined'
import ImageOutlined from '@mui/icons-material/ImageOutlined'
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined'
import ZoomInOutlined from '@mui/icons-material/ZoomInOutlined'
import ZoomOutOutlined from '@mui/icons-material/ZoomOutOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import Typography from '@mui/material/Typography'
import { Canvas } from '@react-three/fiber'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { FormaCocina, MaterialAsignado, MedidasM } from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import { puntoDeVista, type ComandoCamara, type Vista } from '../../escena/camara'
import { ControlCamara } from '../../escena/ControlCamara'
import { distribuir, type MuebleResuelto } from '../../escena/distribucion'
import { EscenaCocina } from '../../escena/EscenaCocina'

interface Props {
  forma: FormaCocina
  medidas: MedidasM
  muebles: MuebleResuelto[]
  materiales: MaterialAsignado[]
  granitos: Granito[]
  nombreArchivo: string
}

export function VistaPrevia3D({ forma, medidas, muebles, materiales, granitos, nombreArchivo }: Props) {
  const [vista, setVista] = useState<Vista>('frontal')
  const [comando, setComando] = useState<ComandoCamara | null>(null)
  const [autoRotar, setAutoRotar] = useState(false)
  const lienzo = useRef<HTMLCanvasElement | null>(null)
  const contador = useRef(0)

  const { colocaciones, desbordados } = useMemo(() => distribuir(forma, medidas, muebles), [forma, medidas, muebles])
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

  const exportar = () => {
    const el = lienzo.current
    if (el === null) return
    const enlace = document.createElement('a')
    enlace.download = `${nombreArchivo || 'diseno'}.png`
    enlace.href = el.toDataURL('image/png')
    enlace.click()
  }

  return (
    <Box
      component="section"
      aria-label="Vista 3D"
      sx={{ position: 'relative', height: 'max(520px, calc(100dvh - 150px))', borderRadius: 2, overflow: 'hidden', background: 'linear-gradient(145deg, #EDEAE4 0%, #D8D4CC 100%)', border: 1, borderColor: 'divider' }}
    >
      <Canvas
        shadows="percentage"
        camera={{ position: inicial.posicion, fov: 45, near: 0.1, far: 100 }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          lienzo.current = gl.domElement
        }}
        aria-label="Cocina en 3D"
      >
        <EscenaCocina forma={forma} medidas={medidas} colocaciones={colocaciones} materiales={materiales} granitos={granitos} />
        <ControlCamara comando={comando} medidas={medidas} autoRotar={autoRotar} />
      </Canvas>

      <Typography
        variant="caption"
        sx={{ position: 'absolute', top: 12, left: 12, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.85)', color: 'text.primary' }}
      >
        {medidas.ancho} × {medidas.fondo} m · {muebles.length} muebles
      </Typography>
      {desbordados.length > 0 && (
        <Alert severity="warning" sx={{ position: 'absolute', top: 12, right: 12, maxWidth: 320 }}>
          {desbordados.length === 1 ? '1 mueble no cabe' : `${desbordados.length} muebles no caben`} en la cocina. Agranda las medidas o quita alguno.
        </Alert>
      )}

      <Paper
        role="toolbar"
        aria-label="Controles de cámara"
        elevation={3}
        sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 0.25, px: 1, borderRadius: 6, maxWidth: 'calc(100% - 16px)' }}
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
        <IconButton aria-label="Exportar imagen" onClick={exportar}><ImageOutlined /></IconButton>
      </Paper>
    </Box>
  )
}

type DistributivoOmit = ComandoCamara extends infer C ? (C extends unknown ? Omit<C, 'id'> : never) : never
