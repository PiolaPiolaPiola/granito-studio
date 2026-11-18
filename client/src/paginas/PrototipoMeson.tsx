import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useCallback, useState } from 'react'
import { granitosApi } from '../api'
import { EstadoConsulta } from '../componentes/EstadoConsulta'
import { MuestraGranito } from '../componentes/MuestraGranito'
import { useConsulta } from '../hooks/useConsulta'
import { Losa } from '../escena/Losa'

/**
 * F2 · Prototipo aislado: una sola losa de mesón con la textura del granito elegido.
 * Sirve para ajustar iluminación, escala de la textura y acabado brillante/mate
 * antes de armar la cocina completa (F4).
 */
export function PrototipoMeson() {
  const consulta = useConsulta(useCallback(() => granitosApi.listar({ limite: 100 }), []))
  const [elegidoId, setElegidoId] = useState<string | null>(null)
  const granitos = consulta.datos?.items ?? []
  const granito = granitos.find((g) => g._id === elegidoId) ?? granitos[0]

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography component="h1" variant="h1">Prototipo de mesón</Typography>
      <Typography color="text.secondary">
        Losa de 2.4 × 0.6 m con la textura del granito elegido. Arrastra para girar, rueda para acercar.
      </Typography>
      <EstadoConsulta cargando={consulta.cargando && consulta.datos === undefined} error={consulta.error} onReintentar={consulta.recargar} />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {granitos.map((g) => (
          <ButtonBase key={g._id} aria-pressed={g._id === granito?._id} onClick={() => setElegidoId(g._id)} sx={{ flexDirection: 'column', gap: 0.5, p: 0.5, borderRadius: 2, width: 76 }}>
            <MuestraGranito imagenUrl={g.imagenUrl} sx={{ width: 48, height: 48, borderRadius: '50%', ...(g._id === granito?._id ? { border: 3, borderColor: 'primary.main' } : {}) }} />
            <Typography variant="caption" noWrap sx={{ maxWidth: '100%' }}>{g.nombre}</Typography>
          </ButtonBase>
        ))}
      </Box>

      <Box sx={{ height: 'max(420px, 60dvh)', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', background: 'linear-gradient(145deg, #EDEAE4 0%, #D8D4CC 100%)' }}>
        <Canvas shadows="percentage" camera={{ position: [1.8, 1.4, 2.6], fov: 40 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 5, 3]} intensity={1.8} castShadow />
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={3} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
            <Lightformer form="rect" intensity={1.5} position={[-5, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
          </Environment>
          <Losa
            dimensiones={[2.4, 0.04, 0.6]}
            posicion={[0, 0.9, 0]}
            material={{ granito }}
          />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={8} blur={2.5} />
          <OrbitControls target={[0, 0.9, 0]} maxPolarAngle={Math.PI / 2 - 0.02} />
        </Canvas>
      </Box>
      {granito !== undefined && (
        <Typography variant="body2" color="text.secondary">
          {granito.nombre} · acabado {granito.acabado}
        </Typography>
      )}
    </Box>
  )
}
