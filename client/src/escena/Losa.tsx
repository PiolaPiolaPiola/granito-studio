import { MaterialPiedra } from './MaterialPiedra'
import { COLOR_PIEDRA_POR_DEFECTO, type MaterialResuelto } from './materiales'

interface Props {
  /** Ancho (x), grosor (y) y fondo (z), en metros. */
  dimensiones: [number, number, number]
  posicion?: [number, number, number]
  material: MaterialResuelto
}

/** Placa de piedra: sirve para el mesón (horizontal) y el salpicadero (vertical, con otras medidas). */
export function Losa({ dimensiones, posicion = [0, 0, 0], material }: Props) {
  const [x, y, z] = dimensiones
  // La cara que más se ve es la más grande: de ahí sale la escala de la textura.
  const tamano: [number, number] = y < z && y < x ? [x, z] : z < x && z < y ? [x, y] : [z, y]
  return (
    <mesh position={posicion} castShadow receiveShadow>
      <boxGeometry args={dimensiones} />
      <MaterialPiedra material={material} colorPorDefecto={COLOR_PIEDRA_POR_DEFECTO} tamano={tamano} />
    </mesh>
  )
}
