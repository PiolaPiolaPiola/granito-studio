import { generarObjectId } from '../infra/generarId'
import type { MedidasM, Ubicacion } from './diseno'
import type { Espacio } from './mueble'

/**
 * Objetos de referencia: no son muebles del taller. Dan escala y contexto al diseño (una
 * taza de baño, un sofá, la nevera) y no entran en la cotización. Espejo del servidor.
 */
export const TIPOS_OBJETO = ['sofa', 'mesa_centro', 'televisor', 'alfombra', 'comedor', 'nevera', 'inodoro', 'ducha', 'planta'] as const
export type TipoObjeto = (typeof TIPOS_OBJETO)[number]

export const ETIQUETA_OBJETO: Record<TipoObjeto, string> = {
  sofa: 'Sofá',
  mesa_centro: 'Mesa de centro',
  televisor: 'Televisor',
  alfombra: 'Alfombra',
  comedor: 'Comedor',
  nevera: 'Nevera',
  inodoro: 'Taza de baño',
  ducha: 'Ducha',
  planta: 'Planta',
}

/** Huella en planta (metros) de cada objeto: ancho (x) y fondo (z) sin girar. */
export const HUELLA_OBJETO: Record<TipoObjeto, { ancho: number; fondo: number; alto: number }> = {
  sofa: { ancho: 2, fondo: 0.9, alto: 0.85 },
  mesa_centro: { ancho: 1, fondo: 0.55, alto: 0.42 },
  televisor: { ancho: 1.25, fondo: 0.06, alto: 1.5 },
  alfombra: { ancho: 2.4, fondo: 1.6, alto: 0.01 },
  comedor: { ancho: 1.6, fondo: 1.4, alto: 0.95 },
  nevera: { ancho: 0.7, fondo: 0.7, alto: 1.8 },
  inodoro: { ancho: 0.4, fondo: 0.68, alto: 0.78 },
  ducha: { ancho: 0.9, fondo: 0.9, alto: 2 },
  planta: { ancho: 0.45, fondo: 0.45, alto: 1.1 },
}

/** Qué objetos tiene sentido ofrecer en cada espacio. */
export const OBJETOS_POR_ESPACIO: Record<Espacio, readonly TipoObjeto[]> = {
  cocina: ['nevera', 'comedor', 'planta'],
  bano: ['inodoro', 'ducha', 'planta'],
  sala: ['sofa', 'mesa_centro', 'televisor', 'alfombra', 'comedor', 'planta'],
}

export interface ObjetoReferencia {
  _id: string
  tipo: TipoObjeto
  ubicacion: Ubicacion
}

/**
 * Objetos con los que arranca un espacio nuevo, ubicados según sus medidas: el sofá mira a
 * la pared del fondo (donde va el mueble de TV), la taza queda en una esquina, etc.
 */
export function objetosPorDefecto(espacio: Espacio, { ancho, fondo }: MedidasM): ObjetoReferencia[] {
  const nuevo = (tipo: TipoObjeto, x: number, z: number, rotacion: Ubicacion['rotacion'] = 0): ObjetoReferencia => ({
    _id: generarObjectId(),
    tipo,
    ubicacion: { x: redondear(x), z: redondear(z), rotacion },
  })
  if (espacio === 'sala') {
    return [
      nuevo('televisor', 0, -fondo / 2 + 0.05),
      nuevo('alfombra', 0, fondo * 0.1),
      nuevo('mesa_centro', 0, fondo * 0.1),
      nuevo('sofa', 0, Math.min(fondo / 2 - 0.5, fondo * 0.1 + 1.2), 180),
      nuevo('planta', ancho / 2 - 0.35, fondo / 2 - 0.35),
    ]
  }
  if (espacio === 'bano') {
    return [nuevo('inodoro', ancho / 2 - 0.45, -fondo / 2 + 0.36), nuevo('ducha', -ancho / 2 + 0.47, fondo / 2 - 0.47)]
  }
  return [nuevo('nevera', -ancho / 2 + 0.37, fondo / 2 - 0.37, 90), nuevo('comedor', ancho / 4, fondo / 2 - 0.75)]
}

function redondear(v: number): number {
  return Math.round(v * 100) / 100
}
