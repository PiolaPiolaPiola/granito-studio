import { useTexture } from '@react-three/drei'
import { Suspense, useEffect, useMemo } from 'react'
import { SRGBColorSpace } from 'three'
import { materialDe, type Mueble } from '../dominio/mueble'
import { COLOR_MUEBLE_POR_DEFECTO } from '../dominio/paleta'
import { MaterialPiedra } from './MaterialPiedra'
import type { MaterialResuelto } from './materiales'
import { texturaMadera } from './texturas'

/** Cuánto mide en el mundo real una repetición de la veta (metros). */
const LADO_VETA_M = 0.6

interface Props {
  mueble: Mueble
  /** Material asignado en el diseño (granito o color); manda sobre el del catálogo. */
  asignado: MaterialResuelto
  /** Tamaño de la cara principal (metros), para escalar la veta. */
  tamano: [number, number]
}

/**
 * Material del cuerpo de un mueble:
 * - si el diseño le asignó un granito → la piedra (con su textura);
 * - si no, el material del catálogo (madera con veta, metal o laca) con el color del
 *   diseño o, si no hay, el del catálogo.
 */
export function MaterialMueble({ mueble, asignado, tamano }: Props) {
  if (asignado.granito !== undefined) {
    return <MaterialPiedra material={asignado} colorPorDefecto={COLOR_MUEBLE_POR_DEFECTO} tamano={tamano} />
  }
  const color = asignado.colorHex ?? mueble.colorHex ?? COLOR_MUEBLE_POR_DEFECTO
  return <MaterialSegunTipo material={materialDe(mueble)} color={color} tamano={tamano} />
}

export function MaterialSegunTipo({ material, color, tamano }: { material: ReturnType<typeof materialDe>; color: string; tamano: [number, number] }) {
  const veta = useMemo(() => {
    if (material !== 'madera') return null
    const copia = texturaMadera(color).clone()
    copia.repeat.set(Math.max(1, tamano[0] / LADO_VETA_M), Math.max(1, tamano[1] / LADO_VETA_M))
    copia.needsUpdate = true
    return copia
  }, [material, color, tamano])

  useEffect(() => () => veta?.dispose(), [veta])

  if (material === 'metal') return <meshStandardMaterial color={color} metalness={0.85} roughness={0.32} />
  if (material === 'lacado') return <meshStandardMaterial color={color} metalness={0} roughness={0.28} />
  return <meshStandardMaterial map={veta} roughness={0.68} />
}

interface PropsFrente {
  url: string
  ancho: number
  alto: number
  /** z del frente de la caja (fondo / 2). */
  z: number
}

/**
 * Foto del mueble real pegada al frente: un plano apenas delante de la cara +z de la caja.
 * Mientras carga no se dibuja nada (se ve el material del cuerpo).
 */
export function FrenteConFoto(props: PropsFrente) {
  return (
    <Suspense fallback={null}>
      <FotoCargada {...props} />
    </Suspense>
  )
}

function FotoCargada({ url, ancho, alto, z }: PropsFrente) {
  const base = useTexture(url)
  // Se trabaja sobre una copia: la textura de useTexture está en caché y se comparte.
  const textura = useMemo(() => {
    const copia = base.clone()
    copia.colorSpace = SRGBColorSpace
    copia.needsUpdate = true
    return copia
  }, [base])
  useEffect(() => () => textura.dispose(), [textura])
  return (
    <mesh position={[0, 0, z + 0.002]} receiveShadow>
      <planeGeometry args={[ancho, alto]} />
      <meshStandardMaterial map={textura} roughness={0.6} />
    </mesh>
  )
}
