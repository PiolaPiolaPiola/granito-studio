import { Environment, Lightformer } from '@react-three/drei'
import { useMemo } from 'react'
import type { FormaCocina, MaterialAsignado, MedidasM } from '../dominio/diseno'
import type { Granito } from '../dominio/granito'
import { ALTURA_PARED, type Colocacion } from './distribucion'
import { resolverMaterial } from './materiales'
import { PiezaMueble } from './PiezaMueble'

interface Props {
  forma: FormaCocina
  medidas: MedidasM
  colocaciones: Colocacion[]
  materiales: MaterialAsignado[]
  granitos: Granito[]
}

/** Todo lo que vive dentro del <Canvas>: luces, piso, paredes y los muebles colocados. */
export function EscenaCocina({ forma, medidas, colocaciones, materiales, granitos }: Props) {
  const granitosPorId = useMemo(() => new Map(granitos.map((g) => [g._id, g])), [granitos])
  const meson = resolverMaterial(materiales, granitosPorId, 'meson')
  const salpicadero = resolverMaterial(materiales, granitosPorId, 'salpicadero')
  const { ancho, fondo } = medidas

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[ancho * 0.6, 5, fondo]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      {/* Reflejos de estudio generados en el momento: no descarga ningún HDR de internet. */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 3]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-5, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[5, 2, 0]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>

      {/* piso */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ancho + 1, fondo + 1]} />
        <meshStandardMaterial color="#dcd6ca" roughness={0.9} />
      </mesh>
      <Paredes forma={forma} ancho={ancho} fondo={fondo} />

      {colocaciones.map((c) => (
        <PiezaMueble
          key={c.id}
          colocacion={c}
          materialMueble={resolverMaterial(materiales, granitosPorId, 'mueble', c.id)}
          materialMeson={meson}
          materialSalpicadero={salpicadero}
        />
      ))}
    </>
  )
}

function Paredes({ forma, ancho, fondo }: { forma: FormaCocina; ancho: number; fondo: number }) {
  const color = '#f1eee8'
  return (
    <>
      <mesh position={[0, ALTURA_PARED / 2, -fondo / 2 - 0.01]} receiveShadow>
        <planeGeometry args={[ancho, ALTURA_PARED]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {(forma === 'L' || forma === 'U') && (
        <mesh position={[ancho / 2 + 0.01, ALTURA_PARED / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[fondo, ALTURA_PARED]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      )}
      {forma === 'U' && (
        <mesh position={[-ancho / 2 - 0.01, ALTURA_PARED / 2, 0]} rotation-y={Math.PI / 2} receiveShadow>
          <planeGeometry args={[fondo, ALTURA_PARED]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      )}
    </>
  )
}
