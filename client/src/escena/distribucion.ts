import type { FormaCocina, MedidasM } from '../dominio/diseno'
import type { Mueble } from '../dominio/mueble'

/**
 * Distribución de los muebles en la cocina: función PURA (datos → posiciones 3D),
 * sin React ni three.js, para poder probarla y razonarla por separado.
 *
 * Sistema de coordenadas (metros): X a la derecha, Y arriba, Z hacia el espectador.
 * La cocina está centrada en el origen; la pared del fondo está en z = -fondo/2.
 *
 * Idea: cada forma define "tramos" (paredes por donde corre una hilera). Los
 * muebles, en orden de `posicion`, se colocan uno tras otro en su hilera y pasan
 * al siguiente tramo cuando ya no caben.
 */

export const PROFUNDIDAD_BASE = 0.6
export const ALTURA_SUPERIORES = 1.4
export const ALTURA_PARED = 2.6

export type Capa = 'suelo' | 'alto' | 'isla'
export type Muro = 'fondo' | 'derecha' | 'izquierda' | 'isla'

export interface MuebleResuelto {
  /** `_id` del mueble dentro del diseño (no el del catálogo). */
  _id: string
  posicion: number
  mueble: Mueble
}

export interface Colocacion {
  id: string
  mueble: Mueble
  capa: Capa
  muro: Muro
  /** Centro del mueble. */
  centro: [number, number, number]
  /** Giro sobre Y, de modo que el frente mire hacia dentro de la cocina. */
  rotY: number
  ancho: number
  alto: number
  fondo: number
  /** true si el mueble no cabe en la pared y se sale del espacio. */
  desborda: boolean
}

interface Tramo {
  muro: Muro
  origen: [number, number]
  direccion: [number, number]
  normal: [number, number]
  longitud: number
}

export function tramosPara(forma: FormaCocina, { ancho, fondo }: MedidasM): Tramo[] {
  const p = PROFUNDIDAD_BASE
  const largo = (v: number) => Math.max(0.3, v)
  const paredFondo = (inicio: number, longitud: number): Tramo => ({
    muro: 'fondo', origen: [-ancho / 2 + inicio, -fondo / 2], direccion: [1, 0], normal: [0, 1], longitud: largo(longitud),
  })
  const paredDerecha: Tramo = { muro: 'derecha', origen: [ancho / 2, -fondo / 2], direccion: [0, 1], normal: [-1, 0], longitud: largo(fondo) }
  const paredIzquierda: Tramo = { muro: 'izquierda', origen: [-ancho / 2, -fondo / 2], direccion: [0, 1], normal: [1, 0], longitud: largo(fondo) }

  switch (forma) {
    case 'L':
      return [paredFondo(0, ancho - p), paredDerecha]
    case 'U':
      return [paredFondo(p, ancho - 2 * p), paredDerecha, paredIzquierda]
    default:
      return [paredFondo(0, ancho)]
  }
}

function capaDe(mueble: Mueble): Capa {
  if (mueble.tipo === 'superior') return 'alto'
  if (mueble.tipo === 'isla') return 'isla'
  return 'suelo'
}

export interface ResultadoDistribucion {
  colocaciones: Colocacion[]
  desbordados: Colocacion[]
}

export function distribuir(forma: FormaCocina, medidas: MedidasM, muebles: MuebleResuelto[]): ResultadoDistribucion {
  const tramos = tramosPara(forma, medidas)
  const cursores = { suelo: { tramo: 0, usado: 0 }, alto: { tramo: 0, usado: 0 } }
  const colocaciones: Colocacion[] = []
  const islas: MuebleResuelto[] = []

  const ordenados = [...muebles].sort((a, b) => a.posicion - b.posicion)

  for (const item of ordenados) {
    const capa = capaDe(item.mueble)
    if (capa === 'isla') {
      islas.push(item)
      continue
    }
    const ancho = item.mueble.anchoCm / 100
    const alto = item.mueble.altoCm / 100
    const fondo = item.mueble.fondoCm / 100
    const cursor = cursores[capa]

    // Si no cabe en lo que queda de esta pared, pasa a la siguiente.
    while (cursor.tramo < tramos.length - 1 && cursor.usado + ancho > tramos[cursor.tramo].longitud + 1e-6) {
      cursor.tramo += 1
      cursor.usado = 0
    }
    const tramo = tramos[cursor.tramo]
    const desborda = cursor.usado + ancho > tramo.longitud + 1e-6
    const avance = cursor.usado + ancho / 2

    colocaciones.push({
      id: item._id,
      mueble: item.mueble,
      capa,
      muro: tramo.muro,
      centro: [
        tramo.origen[0] + tramo.direccion[0] * avance + (tramo.normal[0] * fondo) / 2,
        capa === 'alto' ? ALTURA_SUPERIORES + alto / 2 : alto / 2,
        tramo.origen[1] + tramo.direccion[1] * avance + (tramo.normal[1] * fondo) / 2,
      ],
      rotY: Math.atan2(tramo.normal[0], tramo.normal[1]),
      ancho,
      alto,
      fondo,
      desborda,
    })
    cursor.usado += ancho
  }

  // Islas: una hilera centrada, separada de la pared de trabajo.
  if (islas.length > 0) {
    const total = islas.reduce((suma, i) => suma + i.mueble.anchoCm / 100, 0)
    const fondoMax = Math.max(...islas.map((i) => i.mueble.fondoCm / 100))
    const desborda = total > medidas.ancho - 0.2
    const zIdeal = -medidas.fondo / 2 + PROFUNDIDAD_BASE + 1 + fondoMax / 2
    const z = Math.min(zIdeal, medidas.fondo / 2 - fondoMax / 2)
    let usado = 0
    for (const item of islas) {
      const ancho = item.mueble.anchoCm / 100
      const alto = item.mueble.altoCm / 100
      colocaciones.push({
        id: item._id,
        mueble: item.mueble,
        capa: 'isla',
        muro: 'isla',
        centro: [-total / 2 + usado + ancho / 2, alto / 2, z],
        rotY: Math.PI,
        ancho,
        alto,
        fondo: item.mueble.fondoCm / 100,
        desborda,
      })
      usado += ancho
    }
  }

  return { colocaciones, desbordados: colocaciones.filter((c) => c.desborda) }
}
