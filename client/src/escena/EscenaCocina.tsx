import { Environment, Lightformer } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Plane, Vector3 } from 'three'
import type { AcabadosMeson, FormaCocina, MaterialAsignado, MedidasM } from '../dominio/diseno'
import type { Granito } from '../dominio/granito'
import { ALTURA_PARED, type Colocacion } from './distribucion'
import { resolverMaterial } from './materiales'
import { PiezaMueble } from './PiezaMueble'

/** Al arrastrar, las posiciones se redondean a 5 cm (más fácil alinear muebles). */
const PASO_M = 0.05
const ajustar = (v: number) => Math.round(v / PASO_M) * PASO_M

const PISO = new Plane(new Vector3(0, 1, 0), 0)

/** Dónde corta el rayo del cursor al plano del piso (y = 0). */
function puntoEnPiso(e: ThreeEvent<PointerEvent>): Vector3 {
  return e.ray.intersectPlane(PISO, new Vector3()) ?? e.point
}

interface Props {
  forma: FormaCocina
  medidas: MedidasM
  acabados: AcabadosMeson
  colocaciones: Colocacion[]
  materiales: MaterialAsignado[]
  granitos: Granito[]
  /** `_id` del mueble del diseño seleccionado. */
  seleccionado: string | null
  onSeleccionar?: (id: string) => void
  /** Solo en forma libre: nueva posición (x, z) del mueble arrastrado. */
  onMover?: (id: string, x: number, z: number) => void
  /** Avisa cuándo empieza y termina un arrastre (para pausar la cámara orbital). */
  onArrastrando?: (activo: boolean) => void
}

/** Todo lo que vive dentro del <Canvas>: luces, piso, paredes y los muebles colocados. */
export function EscenaCocina({ forma, medidas, acabados, colocaciones, materiales, granitos, seleccionado, onSeleccionar, onMover, onArrastrando }: Props) {
  const granitosPorId = useMemo(() => new Map(granitos.map((g) => [g._id, g])), [granitos])
  const meson = resolverMaterial(materiales, granitosPorId, 'meson')
  const salpicadero = resolverMaterial(materiales, granitosPorId, 'salpicadero')
  const { ancho, fondo } = medidas
  const arrastre = useRef<{ id: string; dx: number; dz: number } | null>(null)
  const libre = forma === 'libre'

  // El arrastre termina aunque se suelte el botón fuera del lienzo.
  useEffect(() => {
    const soltar = () => {
      if (arrastre.current === null) return
      arrastre.current = null
      onArrastrando?.(false)
    }
    window.addEventListener('pointerup', soltar)
    return () => window.removeEventListener('pointerup', soltar)
  }, [onArrastrando])

  const empezar = (c: Colocacion) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onSeleccionar?.(c.id)
    if (!libre || onMover === undefined) return
    // El desfase se mide en el PISO bajo el cursor (no en la cara del mueble que se tocó):
    // si no, al tomar un mueble alto por arriba saltaría hacia el fondo.
    const punto = puntoEnPiso(e)
    arrastre.current = { id: c.id, dx: c.centro[0] - punto.x, dz: c.centro[2] - punto.z }
    onArrastrando?.(true)
  }

  const mover = (e: ThreeEvent<PointerEvent>) => {
    const actual = arrastre.current
    if (actual === null || onMover === undefined) return
    const punto = puntoEnPiso(e)
    onMover(actual.id, ajustar(punto.x + actual.dx), ajustar(punto.z + actual.dz))
  }

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

      {/* piso: también recibe el movimiento del puntero mientras se arrastra un mueble */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow onPointerMove={mover}>
        <planeGeometry args={[ancho + (libre ? 8 : 1), fondo + (libre ? 8 : 1)]} />
        <meshStandardMaterial color="#dcd6ca" roughness={0.9} />
      </mesh>
      {libre && <BordeDelEspacio ancho={ancho} fondo={fondo} />}
      <Paredes forma={forma} ancho={ancho} fondo={fondo} />

      {colocaciones.map((c) => (
        <PiezaMueble
          key={c.id}
          colocacion={c}
          acabados={acabados}
          materialMueble={resolverMaterial(materiales, granitosPorId, 'mueble', c.id)}
          materialMeson={meson}
          materialSalpicadero={salpicadero}
          seleccionado={c.id === seleccionado}
          onPointerDown={onSeleccionar === undefined ? undefined : empezar(c)}
        />
      ))}
    </>
  )
}

/** En el espacio libre se marca en el piso el contorno del cuarto. */
function BordeDelEspacio({ ancho, fondo }: { ancho: number; fondo: number }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
      <planeGeometry args={[ancho, fondo]} />
      <meshStandardMaterial color="#e9e4da" roughness={0.95} />
    </mesh>
  )
}

function Paredes({ forma, ancho, fondo }: { forma: FormaCocina; ancho: number; fondo: number }) {
  const color = '#f1eee8'
  const laterales = forma === 'L' || forma === 'U' || forma === 'libre'
  return (
    <>
      <mesh position={[0, ALTURA_PARED / 2, -fondo / 2 - 0.01]} receiveShadow>
        <planeGeometry args={[ancho, ALTURA_PARED]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {laterales && (
        <mesh position={[ancho / 2 + 0.01, ALTURA_PARED / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[fondo, ALTURA_PARED]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      )}
      {(forma === 'U' || forma === 'libre') && (
        <mesh position={[-ancho / 2 - 0.01, ALTURA_PARED / 2, 0]} rotation-y={Math.PI / 2} receiveShadow>
          <planeGeometry args={[fondo, ALTURA_PARED]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      )}
    </>
  )
}
