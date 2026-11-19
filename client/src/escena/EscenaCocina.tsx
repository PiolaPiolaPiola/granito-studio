import { ContactShadows, Environment, Html, Lightformer, Line } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Plane, Vector3 } from 'three'
import type { AcabadosMeson, FormaCocina, MaterialAsignado, MedidasM } from '../dominio/diseno'
import type { Granito } from '../dominio/granito'
import type { ObjetoReferencia } from '../dominio/objetos'
import { ALTURA_PARED, type Colocacion } from './distribucion'
import { resolverMaterial } from './materiales'
import { ObjetosReferencia } from './ObjetosReferencia'
import { PiezaMueble } from './PiezaMueble'
import { texturaPiso } from './texturas'

/** Al arrastrar, las posiciones se redondean a 5 cm (más fácil alinear muebles). */
const PASO_M = 0.05
const ajustar = (v: number) => Math.round(v / PASO_M) * PASO_M
/** Lado de una repetición de la textura del piso: 2 baldosas de 60 cm. */
const LADO_PISO_M = 1.2

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
  objetos?: ObjetoReferencia[]
  /** `_id` del mueble seleccionado, u `obj:<id>` si es un objeto de referencia. */
  seleccionado: string | null
  onSeleccionar?: (id: string) => void
  /** Nueva posición (x, z) del mueble u objeto arrastrado (mismo formato de id). */
  onMover?: (id: string, x: number, z: number) => void
  /** Avisa cuándo empieza y termina un arrastre (para pausar la cámara orbital). */
  onArrastrando?: (activo: boolean) => void
  /** Medidas del espacio dibujadas en el piso. */
  mostrarCotas?: boolean
  /** Sobre la foto del cliente: sin piso ni paredes, solo los muebles y sus sombras. */
  sobreFoto?: boolean
}

/** Todo lo que vive dentro del <Canvas>: luces, piso, paredes, muebles, objetos y cotas. */
export function EscenaCocina(props: Props) {
  const { forma, medidas, acabados, colocaciones, materiales, granitos, objetos = [], seleccionado, onSeleccionar, onMover, onArrastrando, mostrarCotas = false, sobreFoto = false } = props
  const granitosPorId = useMemo(() => new Map(granitos.map((g) => [g._id, g])), [granitos])
  const meson = resolverMaterial(materiales, granitosPorId, 'meson')
  const salpicadero = resolverMaterial(materiales, granitosPorId, 'salpicadero')
  const { ancho, fondo } = medidas
  const arrastre = useRef<{ id: string; dx: number; dz: number; x0: number; z0: number; movido: boolean } | null>(null)
  const mayor = Math.max(ancho, fondo)

  const pisoTextura = useMemo(() => {
    const t = texturaPiso().clone()
    t.repeat.set((ancho + 1) / LADO_PISO_M, (fondo + 1) / LADO_PISO_M)
    t.needsUpdate = true
    return t
  }, [ancho, fondo])
  useEffect(() => () => pisoTextura.dispose(), [pisoTextura])

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

  /** Empieza a seleccionar/arrastrar algo cuyo centro en planta es (cx, cz). */
  const empezar = (id: string, cx: number, cz: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onSeleccionar?.(id)
    if (onMover === undefined) return
    // El desfase se mide en el PISO bajo el cursor (no en la cara que se tocó):
    // si no, al tomar un mueble alto por arriba saltaría hacia el fondo.
    const punto = puntoEnPiso(e)
    arrastre.current = { id, dx: cx - punto.x, dz: cz - punto.z, x0: punto.x, z0: punto.z, movido: false }
    onArrastrando?.(true)
  }

  const mover = (e: ThreeEvent<PointerEvent>) => {
    const actual = arrastre.current
    if (actual === null || onMover === undefined) return
    const punto = puntoEnPiso(e)
    // Un clic con un temblor de la mano no es un arrastre (no debe mover ni cambiar la forma).
    if (!actual.movido && Math.hypot(punto.x - actual.x0, punto.z - actual.z0) < 0.04) return
    actual.movido = true
    onMover(actual.id, ajustar(punto.x + actual.dx), ajustar(punto.z + actual.dz))
  }

  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#fffaf2', '#c9c1b4', 0.35]} />
      <directionalLight
        position={[ancho * 0.6, 5, fondo]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
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
        <Lightformer form="ring" intensity={2} position={[2, 3, 4]} scale={2} />
      </Environment>

      {/* Superficie invisible y grande que recibe el movimiento del puntero al arrastrar */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} onPointerMove={mover}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {!sobreFoto && (
        <>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[ancho + 1, fondo + 1]} />
            <meshStandardMaterial map={pisoTextura} roughness={0.35} metalness={0.02} />
          </mesh>
          <Paredes forma={forma} ancho={ancho} fondo={fondo} />
        </>
      )}
      {/* Sombra suave de contacto: "asienta" los muebles en el piso (también sobre la foto). */}
      <ContactShadows position={[0, 0.002, 0]} scale={mayor * 2 + 2} resolution={1024} blur={2.4} far={2.5} opacity={sobreFoto ? 0.55 : 0.4} />

      {colocaciones.map((c) => (
        <PiezaMueble
          key={c.id}
          colocacion={c}
          acabados={acabados}
          materialMueble={resolverMaterial(materiales, granitosPorId, 'mueble', c.id)}
          materialMeson={meson}
          materialSalpicadero={salpicadero}
          seleccionado={c.id === seleccionado}
          onPointerDown={onSeleccionar === undefined ? undefined : empezar(c.id, c.centro[0], c.centro[2])}
        />
      ))}

      <ObjetosReferencia
        objetos={objetos}
        seleccionado={seleccionado}
        onPointerDown={onSeleccionar === undefined ? undefined : (o) => empezar(`obj:${o._id}`, o.ubicacion.x, o.ubicacion.z)}
      />

      {mostrarCotas && <Cotas ancho={ancho} fondo={fondo} />}
    </>
  )
}

/** Medidas del espacio dibujadas en el piso, delante y al lado derecho. */
function Cotas({ ancho, fondo }: { ancho: number; fondo: number }) {
  const y = 0.01
  const zFrente = fondo / 2 + 0.25
  const xLado = ancho / 2 + 0.25
  const color = '#6e5532'
  const etiqueta = (texto: string) => (
    <div style={{ background: 'rgba(255,255,255,0.92)', color: '#262320', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {texto}
    </div>
  )
  return (
    <group>
      <Line points={[[-ancho / 2, y, zFrente], [ancho / 2, y, zFrente]]} color={color} lineWidth={1.5} />
      <Line points={[[-ancho / 2, y, zFrente - 0.08], [-ancho / 2, y, zFrente + 0.08]]} color={color} lineWidth={1.5} />
      <Line points={[[ancho / 2, y, zFrente - 0.08], [ancho / 2, y, zFrente + 0.08]]} color={color} lineWidth={1.5} />
      <Html position={[0, y, zFrente]} center>{etiqueta(`${ancho.toLocaleString('es-CO')} m`)}</Html>

      <Line points={[[xLado, y, -fondo / 2], [xLado, y, fondo / 2]]} color={color} lineWidth={1.5} />
      <Line points={[[xLado - 0.08, y, -fondo / 2], [xLado + 0.08, y, -fondo / 2]]} color={color} lineWidth={1.5} />
      <Line points={[[xLado - 0.08, y, fondo / 2], [xLado + 0.08, y, fondo / 2]]} color={color} lineWidth={1.5} />
      <Html position={[xLado, y, 0]} center>{etiqueta(`${fondo.toLocaleString('es-CO')} m`)}</Html>

      <Line points={[[-ancho / 2 - 0.25, 0, -fondo / 2], [-ancho / 2 - 0.25, ALTURA_PARED, -fondo / 2]]} color={color} lineWidth={1} />
      <Html position={[-ancho / 2 - 0.25, ALTURA_PARED / 2, -fondo / 2]} center>{etiqueta(`${ALTURA_PARED.toLocaleString('es-CO')} m de alto`)}</Html>
    </group>
  )
}

function Paredes({ forma, ancho, fondo }: { forma: FormaCocina; ancho: number; fondo: number }) {
  const color = '#f3f0ea'
  const laterales = forma === 'L' || forma === 'U' || forma === 'libre'
  return (
    <>
      <mesh position={[0, ALTURA_PARED / 2, -fondo / 2 - 0.01]} receiveShadow>
        <planeGeometry args={[ancho, ALTURA_PARED]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* guardaescobas */}
      <mesh position={[0, 0.04, -fondo / 2 + 0.005]}>
        <boxGeometry args={[ancho, 0.08, 0.012]} />
        <meshStandardMaterial color="#d8d1c5" roughness={0.6} />
      </mesh>
      {laterales && (
        <mesh position={[ancho / 2 + 0.01, ALTURA_PARED / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[fondo, ALTURA_PARED]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      )}
      {(forma === 'U' || forma === 'libre') && (
        <mesh position={[-ancho / 2 - 0.01, ALTURA_PARED / 2, 0]} rotation-y={Math.PI / 2} receiveShadow>
          <planeGeometry args={[fondo, ALTURA_PARED]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      )}
    </>
  )
}
