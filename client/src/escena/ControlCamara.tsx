import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef, type ComponentRef } from 'react'
import type { MedidasM } from '../dominio/diseno'
import { puntoDeVista, type ComandoCamara } from './camara'

interface Props {
  comando: ComandoCamara | null
  medidas: MedidasM
  autoRotar: boolean
}

/** Cámara orbital + ejecución de las órdenes de la barra (vista, zoom, reiniciar). */
export function ControlCamara({ comando, medidas, autoRotar }: Props) {
  const controles = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera, invalidate } = useThree()

  useEffect(() => {
    const orbita = controles.current
    if (comando === null || orbita === null) return
    if (comando.tipo === 'zoom') {
      // Acercar/alejar = mover la cámara sobre la línea que la une con el objetivo.
      camera.position.sub(orbita.target).multiplyScalar(comando.factor).add(orbita.target)
    } else {
      const punto = puntoDeVista(comando.tipo === 'vista' ? comando.vista : 'inicial', medidas)
      camera.position.set(...punto.posicion)
      orbita.target.set(...punto.objetivo)
    }
    orbita.update()
    invalidate()
    // Solo reacciona a una orden nueva, no a cambios de medidas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comando])

  return (
    <OrbitControls
      ref={controles}
      makeDefault
      autoRotate={autoRotar}
      autoRotateSpeed={1.2}
      target={puntoDeVista('inicial', medidas).objetivo}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={1}
      maxDistance={30}
    />
  )
}
