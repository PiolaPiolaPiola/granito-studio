import { useTexture } from '@react-three/drei'
import { Suspense, useEffect, useMemo } from 'react'
import { RepeatWrapping, SRGBColorSpace } from 'three'
import type { Granito } from '../dominio/granito'
import { propiedadesAcabado, type MaterialResuelto } from './materiales'

/** Cuánto mide en el mundo real una "baldosa" de la textura (metros). */
const LADO_TEXTURA_M = 0.8

interface Props {
  material: MaterialResuelto
  colorPorDefecto: string
  /** Tamaño de la cara principal en metros, para que el grano no se estire. */
  tamano?: [number, number]
}

/**
 * Material de una pieza: granito con textura, color liso o color por defecto.
 * Se usa como hijo de un <mesh>. Mientras la textura carga muestra un color plano.
 */
export function MaterialPiedra({ material, colorPorDefecto, tamano = [1, 1] }: Props) {
  if (material.granito !== undefined) {
    return (
      <Suspense fallback={<meshStandardMaterial color={colorPorDefecto} />}>
        <MaterialConTextura granito={material.granito} tamano={tamano} />
      </Suspense>
    )
  }
  return <meshStandardMaterial color={material.colorHex ?? colorPorDefecto} roughness={0.6} />
}

function MaterialConTextura({ granito, tamano }: { granito: Granito; tamano: [number, number] }) {
  const base = useTexture(granito.imagenUrl)
  const [ancho, alto] = tamano
  // Cada pieza necesita su propia repetición: se clona la textura (la imagen se comparte).
  const textura = useMemo(() => {
    const copia = base.clone()
    copia.wrapS = copia.wrapT = RepeatWrapping
    copia.repeat.set(Math.max(1, ancho / LADO_TEXTURA_M), Math.max(1, alto / LADO_TEXTURA_M))
    copia.colorSpace = SRGBColorSpace
    copia.anisotropy = 8
    copia.needsUpdate = true
    return copia
  }, [base, ancho, alto])

  useEffect(() => () => textura.dispose(), [textura])

  return <meshStandardMaterial map={textura} {...propiedadesAcabado(granito.acabado)} />
}
