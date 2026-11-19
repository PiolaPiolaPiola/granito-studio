import { RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { HUELLA_OBJETO, type ObjetoReferencia, type TipoObjeto } from '../dominio/objetos'
import { gradosARadianes } from './distribucion'

/*
 * Objetos de referencia dibujados con formas simples (cajas redondeadas, cilindros): pesan
 * nada, no se descargan y bastan para dar escala. Todo en metros, con el frente hacia +z.
 */

const BLANCO_LOZA = '#f7f7f5'
const TELA = '#8d8a85'
const MADERA = '#9b6b43'
const ACERO = '#c9cbcd'
const NEGRO = '#1b1b1d'

function Sofa() {
  return (
    <group>
      <RoundedBox args={[2, 0.42, 0.9]} radius={0.06} position={[0, 0.21, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TELA} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[2, 0.45, 0.2]} radius={0.06} position={[0, 0.62, -0.35]} castShadow>
        <meshStandardMaterial color={TELA} roughness={0.95} />
      </RoundedBox>
      {[-1, 1].map((lado) => (
        <RoundedBox key={lado} args={[0.18, 0.62, 0.9]} radius={0.05} position={[lado * 0.91, 0.31, 0]} castShadow>
          <meshStandardMaterial color={TELA} roughness={0.95} />
        </RoundedBox>
      ))}
      {[-0.42, 0.42].map((x) => (
        <RoundedBox key={x} args={[0.8, 0.14, 0.62]} radius={0.05} position={[x, 0.49, 0.06]} castShadow>
          <meshStandardMaterial color="#9a968f" roughness={1} />
        </RoundedBox>
      ))}
    </group>
  )
}

function MesaCentro() {
  return (
    <group>
      <RoundedBox args={[1, 0.04, 0.55]} radius={0.015} position={[0, 0.4, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={MADERA} roughness={0.55} />
      </RoundedBox>
      {[[-0.45, -0.22], [0.45, -0.22], [-0.45, 0.22], [0.45, 0.22]].map(([x, z]) => (
        <mesh key={`${String(x)}${String(z)}`} position={[x, 0.19, z]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.38, 12]} />
          <meshStandardMaterial color={NEGRO} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Televisor() {
  return (
    <group position={[0, 1.15, 0]}>
      <RoundedBox args={[1.25, 0.72, 0.04]} radius={0.01} castShadow>
        <meshStandardMaterial color={NEGRO} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0, 0.021]}>
        <planeGeometry args={[1.21, 0.68]} />
        <meshStandardMaterial color="#0b0d10" metalness={0.2} roughness={0.08} />
      </mesh>
    </group>
  )
}

function Alfombra() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} receiveShadow>
      <planeGeometry args={[2.4, 1.6]} />
      <meshStandardMaterial color="#cdbfa8" roughness={1} />
    </mesh>
  )
}

function Silla({ x, z, giro }: { x: number; z: number; giro: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={giro}>
      <RoundedBox args={[0.44, 0.05, 0.44]} radius={0.01} position={[0, 0.46, 0]} castShadow>
        <meshStandardMaterial color={MADERA} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.44, 0.42, 0.04]} radius={0.01} position={[0, 0.7, -0.2]} castShadow>
        <meshStandardMaterial color={MADERA} roughness={0.6} />
      </RoundedBox>
      {[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([a, b]) => (
        <mesh key={`${String(a)}${String(b)}`} position={[a, 0.22, b]}>
          <cylinderGeometry args={[0.017, 0.017, 0.44, 8]} />
          <meshStandardMaterial color={NEGRO} />
        </mesh>
      ))}
    </group>
  )
}

function Comedor() {
  return (
    <group>
      <RoundedBox args={[1.2, 0.04, 0.8]} radius={0.015} position={[0, 0.74, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={MADERA} roughness={0.5} />
      </RoundedBox>
      {[[-0.52, -0.32], [0.52, -0.32], [-0.52, 0.32], [0.52, 0.32]].map(([x, z]) => (
        <mesh key={`${String(x)}${String(z)}`} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.05, 0.72, 0.05]} />
          <meshStandardMaterial color={NEGRO} />
        </mesh>
      ))}
      <Silla x={-0.3} z={-0.62} giro={0} />
      <Silla x={0.3} z={-0.62} giro={0} />
      <Silla x={-0.3} z={0.62} giro={Math.PI} />
      <Silla x={0.3} z={0.62} giro={Math.PI} />
    </group>
  )
}

function Nevera() {
  return (
    <group>
      <RoundedBox args={[0.7, 1.8, 0.7]} radius={0.02} position={[0, 0.9, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={ACERO} metalness={0.75} roughness={0.28} />
      </RoundedBox>
      <mesh position={[0, 1.15, 0.352]}>
        <planeGeometry args={[0.68, 0.006]} />
        <meshBasicMaterial color="#555" />
      </mesh>
      {[1.45, 0.75].map((y) => (
        <mesh key={y} position={[0.27, y, 0.37]} castShadow>
          <boxGeometry args={[0.02, 0.35, 0.03]} />
          <meshStandardMaterial color="#8a8c8e" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function Inodoro() {
  return (
    <group>
      <RoundedBox args={[0.38, 0.38, 0.18]} radius={0.04} position={[0, 0.6, -0.25]} castShadow>
        <meshStandardMaterial color={BLANCO_LOZA} roughness={0.15} />
      </RoundedBox>
      <mesh position={[0, 0.2, 0.04]} castShadow>
        <cylinderGeometry args={[0.17, 0.13, 0.4, 24]} />
        <meshStandardMaterial color={BLANCO_LOZA} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.41, 0.06]} scale={[1, 1, 1.3]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 28]} />
        <meshStandardMaterial color={BLANCO_LOZA} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Ducha() {
  return (
    <group>
      <RoundedBox args={[0.9, 0.05, 0.9]} radius={0.01} position={[0, 0.025, 0]} receiveShadow>
        <meshStandardMaterial color={BLANCO_LOZA} roughness={0.25} />
      </RoundedBox>
      <mesh position={[0, 1.0, 0.44]}>
        <boxGeometry args={[0.9, 1.95, 0.01]} />
        <meshPhysicalMaterial color="#dfeef0" transmission={0.9} transparent opacity={0.35} roughness={0.05} />
      </mesh>
      <mesh position={[0, 1.95, -0.3]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
        <meshStandardMaterial color={ACERO} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Planta() {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.4, 20]} />
        <meshStandardMaterial color="#d9d2c6" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.32, 20, 16]} />
        <meshStandardMaterial color="#56704a" roughness={0.9} />
      </mesh>
    </group>
  )
}

const MODELOS: Record<TipoObjeto, () => React.JSX.Element> = {
  sofa: Sofa,
  mesa_centro: MesaCentro,
  televisor: Televisor,
  alfombra: Alfombra,
  comedor: Comedor,
  nevera: Nevera,
  inodoro: Inodoro,
  ducha: Ducha,
  planta: Planta,
}

interface Props {
  objetos: ObjetoReferencia[]
  seleccionado: string | null
  onPointerDown?: (objeto: ObjetoReferencia) => (e: ThreeEvent<PointerEvent>) => void
}

/** Los objetos de referencia del diseño; el seleccionado lleva un marco (id con prefijo `obj:`). */
export function ObjetosReferencia({ objetos, seleccionado, onPointerDown }: Props) {
  return (
    <>
      {objetos.map((o) => {
        const Modelo = MODELOS[o.tipo]
        const huella = HUELLA_OBJETO[o.tipo]
        return (
          <group key={o._id} position={[o.ubicacion.x, 0, o.ubicacion.z]} rotation-y={gradosARadianes(o.ubicacion.rotacion)} onPointerDown={onPointerDown?.(o)}>
            <Modelo />
            {seleccionado === `obj:${o._id}` && (
              <mesh position={[0, huella.alto / 2, 0]}>
                <boxGeometry args={[huella.ancho + 0.04, huella.alto + 0.04, huella.fondo + 0.04]} />
                <meshBasicMaterial color="#8f7042" wireframe />
              </mesh>
            )}
          </group>
        )
      })}
    </>
  )
}
