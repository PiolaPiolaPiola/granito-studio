import type { MedidasM } from '../dominio/diseno'

export type Vista = 'frontal' | 'superior'

/** Órdenes que la barra de herramientas le manda a la cámara. `id` cambia en cada orden para que se repita aunque sea igual. */
export type ComandoCamara =
  | { id: number; tipo: 'vista'; vista: Vista }
  | { id: number; tipo: 'zoom'; factor: number }
  | { id: number; tipo: 'reiniciar' }

export interface PuntoDeVista {
  posicion: [number, number, number]
  objetivo: [number, number, number]
}

export function puntoDeVista(vista: Vista | 'inicial', { ancho, fondo }: MedidasM): PuntoDeVista {
  const mayor = Math.max(ancho, fondo)
  switch (vista) {
    case 'frontal':
      return { posicion: [0, 1.5, fondo / 2 + mayor * 1.1 + 1], objetivo: [0, 0.9, 0] }
    case 'superior':
      // Un poco desplazada en z: mirar exactamente hacia abajo deja la cámara sin "arriba".
      return { posicion: [0, mayor * 1.5 + 1.5, 0.01], objetivo: [0, 0, 0] }
    default:
      return { posicion: [ancho * 0.55 + 1, 2.4, fondo / 2 + mayor * 0.9 + 1], objetivo: [0, 0.8, 0] }
  }
}
