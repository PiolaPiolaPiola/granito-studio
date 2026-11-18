import type { Colocacion } from './distribucion'
import { Losa } from './Losa'
import { MaterialPiedra } from './MaterialPiedra'
import { COLOR_MUEBLE_POR_DEFECTO, type MaterialResuelto } from './materiales'

const GROSOR_MESON = 0.03
const ALTURA_SALPICADERO = 0.6
const GROSOR_SALPICADERO = 0.015

interface Props {
  colocacion: Colocacion
  materialMueble: MaterialResuelto
  materialMeson: MaterialResuelto
  materialSalpicadero: MaterialResuelto
}

/**
 * Un mueble con su mesón y salpicadero. Todo se dibuja en coordenadas locales del
 * mueble (el origen es su centro y el frente mira a +z); el grupo lo coloca y gira.
 */
export function PiezaMueble({ colocacion: c, materialMueble, materialMeson, materialSalpicadero }: Props) {
  const tieneMeson = c.mueble.tipo === 'inferior' || c.mueble.tipo === 'isla'
  const tieneSalpicadero = c.mueble.tipo === 'inferior'
  const yAsa = c.mueble.tipo === 'superior' ? -c.alto / 2 + 0.08 : c.alto / 2 - 0.1

  return (
    <group position={c.centro} rotation-y={c.rotY}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[Math.max(0.01, c.ancho - 0.004), c.alto, c.fondo]} />
        <MaterialPiedra material={materialMueble} colorPorDefecto={COLOR_MUEBLE_POR_DEFECTO} tamano={[c.ancho, c.alto]} />
      </mesh>
      {/* tirador */}
      <mesh position={[0, yAsa, c.fondo / 2 + 0.008]} castShadow>
        <boxGeometry args={[Math.min(0.14, c.ancho * 0.5), 0.015, 0.016]} />
        <meshStandardMaterial color="#3b3835" metalness={0.6} roughness={0.35} />
      </mesh>
      {tieneMeson && (
        <Losa
          dimensiones={[c.ancho, GROSOR_MESON, c.fondo + 0.03]}
          posicion={[0, c.alto / 2 + GROSOR_MESON / 2, 0.015]}
          material={materialMeson}
        />
      )}
      {tieneSalpicadero && (
        <Losa
          dimensiones={[c.ancho, ALTURA_SALPICADERO, GROSOR_SALPICADERO]}
          posicion={[0, c.alto / 2 + GROSOR_MESON + ALTURA_SALPICADERO / 2, -c.fondo / 2 + GROSOR_SALPICADERO / 2]}
          material={materialSalpicadero}
        />
      )}
    </group>
  )
}
