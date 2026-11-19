import type { ThreeEvent } from '@react-three/fiber'
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
const GROSOR_SALPICADERO = 0.015

interface Props {
  colocacion: Colocacion
  acabados: AcabadosMeson
  materialMueble: MaterialResuelto
  materialMeson: MaterialResuelto
  materialSalpicadero: MaterialResuelto
  seleccionado: boolean
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void
}

/**
 * Un mueble con su mesón, salpicadero y cascada. Todo se dibuja en coordenadas locales del
 * mueble (el origen es su centro y el frente mira a +z); el grupo lo coloca y gira.
 */
export function PiezaMueble({ colocacion: c, acabados, materialMueble, materialMeson, materialSalpicadero, seleccionado, onPointerDown }: Props) {
  const { tipo } = c.mueble
  const espesor = acabados.espesorCm / 100
  const tieneMeson = CON_MESON.includes(tipo)
  const altoSalpicadero = CON_SALPICADERO.includes(tipo) ? ALTURA_SALPICADERO[acabados.salpicadero] : 0
  const cascada = acabados.cascada && CON_CASCADA.includes(tipo)
  const yAsa = c.capa === 'alto' ? -c.alto / 2 + 0.08 : c.alto / 2 - 0.1
  // Con cascada, el cuerpo queda entre las dos caídas de piedra.
  const anchoCuerpo = Math.max(0.01, c.ancho - 0.004 - (cascada ? 2 * espesor : 0))
  // Los muebles que no tienen foto con su material asignado muestran la foto en el frente.
  const conFoto = c.mueble.imagenUrl !== undefined && materialMueble.granito === undefined && materialMueble.colorHex === undefined

  return (
    <group position={c.centro} rotation-y={c.rotY} onPointerDown={onPointerDown}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[anchoCuerpo, c.alto, c.fondo]} />
        <MaterialMueble mueble={c.mueble} asignado={materialMueble} tamano={[c.ancho, c.alto]} />
      </mesh>
      {conFoto && <FrenteConFoto url={c.mueble.imagenUrl as string} ancho={anchoCuerpo} alto={c.alto} z={c.fondo / 2} />}

      {seleccionado && (
        <mesh>
          <boxGeometry args={[c.ancho + 0.03, c.alto + 0.03, c.fondo + 0.03]} />
          <meshBasicMaterial color="#8f7042" wireframe transparent opacity={0.9} />
        </mesh>
      )}

      {!SIN_TIRADOR.includes(tipo) && (
        <mesh position={[0, yAsa, c.fondo / 2 + 0.008]} castShadow>
          <boxGeometry args={[Math.min(0.14, c.ancho * 0.5), 0.015, 0.016]} />
          <meshStandardMaterial color="#3b3835" metalness={0.6} roughness={0.35} />
        </mesh>
      )}

      {tieneMeson && (
        <Losa
          dimensiones={[c.ancho, espesor, c.fondo + VUELO_MESON]}
          posicion={[0, c.alto / 2 + espesor / 2, VUELO_MESON / 2]}
          material={materialMeson}
        />
      )}

      {cascada && (
        <>
          {[-1, 1].map((lado) => (
            <Losa
              key={lado}
              dimensiones={[espesor, c.alto, c.fondo + VUELO_MESON]}
              posicion={[lado * (c.ancho / 2 - espesor / 2), 0, VUELO_MESON / 2]}
              material={materialMeson}
            />
          ))}
        </>
      )}

      {tipo === 'lavamanos' && (
        // Lavamanos de sobreponer (el más común en las fotos de baños).
        <mesh position={[0, c.alto / 2 + espesor + 0.06, 0.02]} castShadow>
          <boxGeometry args={[Math.min(0.48, c.ancho * 0.7), 0.12, Math.min(0.36, c.fondo * 0.75)]} />
          <meshStandardMaterial color="#f7f7f5" roughness={0.15} />
        </mesh>
      )}

      {altoSalpicadero > 0 && (
        <Losa
          dimensiones={[c.ancho, altoSalpicadero, GROSOR_SALPICADERO]}
          posicion={[0, c.alto / 2 + espesor + altoSalpicadero / 2, -c.fondo / 2 + GROSOR_SALPICADERO / 2]}
          material={materialSalpicadero}
        />
      )}
    </group>
  )
}
