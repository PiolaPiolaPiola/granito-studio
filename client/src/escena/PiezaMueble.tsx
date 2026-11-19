import { RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { normalizarTexto } from '../dominio/comun'
import { ALTURA_SALPICADERO, CON_CASCADA, CON_MESON, CON_SALPICADERO, VUELO_MESON } from '../dominio/cotizacion'
import type { AcabadosMeson } from '../dominio/diseno'
import type { TipoMueble } from '../dominio/mueble'
import type { Colocacion } from './distribucion'
import { Losa } from './Losa'
import { FrenteConFoto, MaterialMueble } from './MaterialMueble'
import type { MaterialResuelto } from './materiales'

// Qué piezas llevan mesón, salpicadero o cascada: lo define `dominio/cotizacion.ts`
// (así lo que se dibuja y lo que se cobra salen de la misma regla).
const SIN_TIRADOR: readonly TipoMueble[] = ['repisa', 'biblioteca', 'barra']
/** Muebles que van apoyados en el piso con zócalo (el rodapié retranqueado de abajo). */
const CON_ZOCALO: readonly TipoMueble[] = ['inferior', 'isla', 'alacena', 'aparador']
const GROSOR_SALPICADERO = 0.015
const ALTO_ZOCALO = 0.1
const RETRANQUEO_ZOCALO = 0.05
const COLOR_JUNTA = '#2a2724'
const COLOR_TIRADOR = '#3b3835'

interface Props {
  colocacion: Colocacion
  acabados: AcabadosMeson
  materialMueble: MaterialResuelto
  materialMeson: MaterialResuelto
  materialSalpicadero: MaterialResuelto
  seleccionado: boolean
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
}

/** Cómo se divide el frente: puertas (líneas verticales) o cajones (horizontales). */
function frentes(nombre: string, tipo: TipoMueble, ancho: number): { puertas: number; cajones: number } {
  const n = normalizarTexto(nombre)
  if (n.includes('cajon')) return { puertas: 1, cajones: 3 }
  if (tipo === 'repisa' || tipo === 'biblioteca' || tipo === 'barra') return { puertas: 1, cajones: 1 }
  return { puertas: ancho >= 0.55 ? 2 : 1, cajones: 1 }
}

/**
 * Un mueble con su mesón, salpicadero y cascada, con los detalles que lo hacen creíble:
 * zócalo, juntas entre puertas o cajones, un tirador por hoja, bordes apenas redondeados y,
 * en los módulos de lavaplatos y estufa, la poceta o la estufa empotrada en el mesón.
 * Todo en coordenadas locales (el origen es el centro y el frente mira a +z).
 */
export function PiezaMueble({ colocacion: c, acabados, materialMueble, materialMeson, materialSalpicadero, seleccionado, onPointerDown }: Props) {
  const { tipo, nombre } = c.mueble
  const espesor = acabados.espesorCm / 100
  const tieneMeson = CON_MESON.includes(tipo)
  const altoSalpicadero = CON_SALPICADERO.includes(tipo) ? ALTURA_SALPICADERO[acabados.salpicadero] : 0
  const cascada = acabados.cascada && CON_CASCADA.includes(tipo)
  const zocalo = CON_ZOCALO.includes(tipo) && c.capa !== 'alto' ? ALTO_ZOCALO : 0
  // Con cascada, el cuerpo queda entre las dos caídas de piedra.
  const anchoCuerpo = Math.max(0.01, c.ancho - 0.004 - (cascada ? 2 * espesor : 0))
  const altoCuerpo = c.alto - zocalo
  const yCuerpo = zocalo / 2
  const conFoto = c.mueble.imagenUrl !== undefined && materialMueble.granito === undefined && materialMueble.colorHex === undefined
  const { puertas, cajones } = frentes(nombre, tipo, anchoCuerpo)
  const nombreNorm = normalizarTexto(nombre)
  const conPoceta = tieneMeson && (nombreNorm.includes('lavaplatos') || nombreNorm.includes('tarja'))
  const conEstufa = tieneMeson && nombreNorm.includes('estufa')
  const zFrente = c.fondo / 2 + 0.002
  const ySobreMeson = c.alto / 2 + espesor

  return (
    <group position={c.centro} rotation-y={c.rotY} onPointerDown={onPointerDown}>
      {/* cuerpo con bordes suaves (atrapan la luz como un mueble real) */}
      <RoundedBox args={[anchoCuerpo, altoCuerpo, c.fondo]} radius={Math.min(0.006, altoCuerpo / 4)} smoothness={2} position={[0, yCuerpo, 0]} castShadow receiveShadow>
        <MaterialMueble mueble={c.mueble} asignado={materialMueble} tamano={[c.ancho, c.alto]} />
      </RoundedBox>
      {conFoto && <FrenteConFoto url={c.mueble.imagenUrl as string} ancho={anchoCuerpo} alto={altoCuerpo} z={c.fondo / 2} />}

      {zocalo > 0 && (
        <mesh position={[0, -c.alto / 2 + zocalo / 2, -RETRANQUEO_ZOCALO / 2]} receiveShadow>
          <boxGeometry args={[anchoCuerpo - 0.01, zocalo, c.fondo - RETRANQUEO_ZOCALO]} />
          <meshStandardMaterial color="#2f2d2b" roughness={0.8} />
        </mesh>
      )}

      {/* juntas entre puertas (verticales) y cajones (horizontales) */}
      {!conFoto &&
        Array.from({ length: puertas - 1 }, (_, i) => (
          <mesh key={`p${String(i)}`} position={[-anchoCuerpo / 2 + ((i + 1) * anchoCuerpo) / puertas, yCuerpo, zFrente]}>
            <planeGeometry args={[0.004, altoCuerpo - 0.01]} />
            <meshBasicMaterial color={COLOR_JUNTA} />
          </mesh>
        ))}
      {!conFoto &&
        Array.from({ length: cajones - 1 }, (_, i) => (
          <mesh key={`c${String(i)}`} position={[0, -c.alto / 2 + zocalo + ((i + 1) * altoCuerpo) / cajones, zFrente]}>
            <planeGeometry args={[anchoCuerpo - 0.01, 0.004]} />
            <meshBasicMaterial color={COLOR_JUNTA} />
          </mesh>
        ))}

      {/* tiradores: uno por puerta (junto a la junta) o uno por cajón (centrado) */}
      {!SIN_TIRADOR.includes(tipo) &&
        (cajones > 1
          ? Array.from({ length: cajones }, (_, i) => (
              <mesh key={`tc${String(i)}`} position={[0, -c.alto / 2 + zocalo + ((i + 0.8) * altoCuerpo) / cajones, c.fondo / 2 + 0.01]} castShadow>
                <boxGeometry args={[Math.min(0.16, anchoCuerpo * 0.4), 0.012, 0.018]} />
                <meshStandardMaterial color={COLOR_TIRADOR} metalness={0.7} roughness={0.3} />
              </mesh>
            ))
          : Array.from({ length: puertas }, (_, i) => {
              const anchoHoja = anchoCuerpo / puertas
              const xHoja = -anchoCuerpo / 2 + anchoHoja * (i + 0.5)
              const haciaJunta = puertas === 1 ? 0 : (i === 0 ? 1 : -1) * (anchoHoja / 2 - 0.05)
              const y = c.capa === 'alto' ? -c.alto / 2 + 0.08 : c.alto / 2 - 0.1
              return (
                <mesh key={`tp${String(i)}`} position={[xHoja + haciaJunta, y, c.fondo / 2 + 0.01]} castShadow>
                  <boxGeometry args={[0.012, 0.14, 0.018]} />
                  <meshStandardMaterial color={COLOR_TIRADOR} metalness={0.7} roughness={0.3} />
                </mesh>
              )
            }))}

      {seleccionado && (
        <mesh>
          <boxGeometry args={[c.ancho + 0.03, c.alto + 0.03, c.fondo + 0.03]} />
          <meshBasicMaterial color="#8f7042" wireframe transparent opacity={0.9} />
        </mesh>
      )}

      {tieneMeson && (
        <Losa dimensiones={[c.ancho, espesor, c.fondo + VUELO_MESON]} posicion={[0, c.alto / 2 + espesor / 2, VUELO_MESON / 2]} material={materialMeson} />
      )}

      {cascada &&
        [-1, 1].map((lado) => (
          <Losa key={lado} dimensiones={[espesor, c.alto, c.fondo + VUELO_MESON]} posicion={[lado * (c.ancho / 2 - espesor / 2), 0, VUELO_MESON / 2]} material={materialMeson} />
        ))}

      {conPoceta && (
        <group position={[0, ySobreMeson + 0.001, 0.02]}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[Math.min(0.55, c.ancho * 0.6), 0.4]} />
            <meshStandardMaterial color="#9fa3a6" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.17, -0.24]} castShadow>
            <cylinderGeometry args={[0.012, 0.016, 0.34, 12]} />
            <meshStandardMaterial color="#c0c3c6" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.33, -0.16]} rotation-x={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.011, 0.011, 0.17, 12]} />
            <meshStandardMaterial color="#c0c3c6" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {conEstufa && (
        <group position={[0, ySobreMeson + 0.004, 0.03]}>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[Math.min(0.58, c.ancho * 0.9), 0.5]} />
            <meshStandardMaterial color="#111214" metalness={0.3} roughness={0.12} />
          </mesh>
          {[[-0.13, -0.11], [0.13, -0.11], [-0.13, 0.11], [0.13, 0.11]].map(([x, z]) => (
            <mesh key={`${String(x)}${String(z)}`} position={[x, 0.008, z]} castShadow>
              <cylinderGeometry args={[0.045, 0.05, 0.016, 20]} />
              <meshStandardMaterial color="#3d3f42" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {tipo === 'lavamanos' && (
        // Lavamanos de sobreponer (el más común en las fotos de baños).
        <RoundedBox args={[Math.min(0.48, c.ancho * 0.7), 0.13, Math.min(0.36, c.fondo * 0.75)]} radius={0.04} position={[0, ySobreMeson + 0.065, 0.02]} castShadow>
          <meshStandardMaterial color="#f7f7f5" roughness={0.12} />
        </RoundedBox>
      )}

      {altoSalpicadero > 0 && (
        <Losa
          dimensiones={[c.ancho, altoSalpicadero, GROSOR_SALPICADERO]}
          posicion={[0, ySobreMeson + altoSalpicadero / 2, -c.fondo / 2 + GROSOR_SALPICADERO / 2]}
          material={materialSalpicadero}
        />
      )}
    </group>
  )
}
