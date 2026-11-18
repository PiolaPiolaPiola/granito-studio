import { generarObjectId } from '../infra/generarId'
import type { ConTiempos } from './comun'

export const FORMAS_COCINA = ['lineal', 'L', 'U', 'isla'] as const
export type FormaCocina = (typeof FORMAS_COCINA)[number]

export const ETIQUETA_FORMA: Record<FormaCocina, string> = {
  lineal: 'Lineal',
  L: 'En L',
  U: 'En U',
  isla: 'Con isla',
}

export const PIEZAS = ['meson', 'salpicadero', 'mueble'] as const
export type Pieza = (typeof PIEZAS)[number]

/** Un mueble colocado en un diseño. Se identifica por `_id` (no por nombre). */
export interface MuebleEnDiseno {
  _id: string
  mueble: string
  posicion: number
}

/** Material de una pieza: un granito del catálogo O un color liso (nunca los dos). */
export interface MaterialAsignado {
  pieza: Pieza
  muebleEnDiseno?: string
  granito?: string
  colorHex?: string
}

export interface MedidasM {
  ancho: number
  fondo: number
}

/** Lo que se envía al guardar (POST / PUT completo). */
export interface EntradaDiseno {
  nombre: string
  forma: FormaCocina
  medidasM: MedidasM
  muebles: MuebleEnDiseno[]
  materiales: MaterialAsignado[]
}

export interface Diseno extends ConTiempos, EntradaDiseno {}

export function disenoVacio(): EntradaDiseno {
  return {
    nombre: 'Nuevo diseño',
    forma: 'L',
    medidasM: { ancho: 3.4, fondo: 2.6 },
    muebles: [],
    materiales: [],
  }
}

// --- Operaciones puras sobre un diseño (fáciles de probar, sin React) ---------

export function buscarMaterial(
  materiales: MaterialAsignado[],
  pieza: Pieza,
  muebleEnDiseno?: string,
): MaterialAsignado | undefined {
  return materiales.find((m) => m.pieza === pieza && m.muebleEnDiseno === muebleEnDiseno)
}

type Acabado = { granito: string } | { colorHex: string }

/** Asigna (o reemplaza) el material de una pieza: como máximo uno por pieza. */
export function asignarMaterial(
  materiales: MaterialAsignado[],
  pieza: Pieza,
  muebleEnDiseno: string | undefined,
  acabado: Acabado,
): MaterialAsignado[] {
  const nuevo: MaterialAsignado = {
    pieza,
    ...(muebleEnDiseno !== undefined ? { muebleEnDiseno } : {}),
    ...acabado,
  }
  const sin = quitarMaterial(materiales, pieza, muebleEnDiseno)
  return [...sin, nuevo]
}

export function quitarMaterial(
  materiales: MaterialAsignado[],
  pieza: Pieza,
  muebleEnDiseno?: string,
): MaterialAsignado[] {
  return materiales.filter((m) => !(m.pieza === pieza && m.muebleEnDiseno === muebleEnDiseno))
}

export function agregarMueble(muebles: MuebleEnDiseno[], idMueble: string): MuebleEnDiseno[] {
  const siguiente = muebles.reduce((max, m) => Math.max(max, m.posicion), 0) + 1
  return [...muebles, { _id: generarObjectId(), mueble: idMueble, posicion: siguiente }]
}

/** Quita el mueble, su material propio y vuelve a numerar las posiciones (1, 2, 3…). */
export function quitarMuebleDeDiseno(
  muebles: MuebleEnDiseno[],
  materiales: MaterialAsignado[],
  id: string,
): { muebles: MuebleEnDiseno[]; materiales: MaterialAsignado[] } {
  const restantes = [...muebles]
    .filter((m) => m._id !== id)
    .sort((a, b) => a.posicion - b.posicion)
    .map((m, i) => ({ ...m, posicion: i + 1 }))
  return { muebles: restantes, materiales: materiales.filter((m) => m.muebleEnDiseno !== id) }
}

/** Sube (-1) o baja (+1) un mueble intercambiando su posición con el vecino. */
export function moverMueble(muebles: MuebleEnDiseno[], id: string, delta: -1 | 1): MuebleEnDiseno[] {
  const orden = [...muebles].sort((a, b) => a.posicion - b.posicion)
  const i = orden.findIndex((m) => m._id === id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= orden.length) return muebles
  const [a, b] = [orden[i], orden[j]]
  return muebles.map((m) =>
    m._id === a._id ? { ...m, posicion: b.posicion } : m._id === b._id ? { ...m, posicion: a.posicion } : m,
  )
}

/** Copia un diseño generando ids nuevos y reapuntando los materiales a ellos. */
export function clonarContenido(origen: EntradaDiseno): EntradaDiseno {
  const nuevosIds = new Map(origen.muebles.map((m) => [m._id, generarObjectId()]))
  return {
    ...origen,
    medidasM: { ...origen.medidasM },
    muebles: origen.muebles.map((m) => ({ ...m, _id: nuevosIds.get(m._id) ?? m._id })),
    materiales: origen.materiales.map((m) => ({
      ...m,
      ...(m.muebleEnDiseno !== undefined ? { muebleEnDiseno: nuevosIds.get(m.muebleEnDiseno) } : {}),
    })),
  }
}

/** Solo los campos editables de un diseño guardado (para el formulario del editor). */
export function aEntrada(diseno: Diseno): EntradaDiseno {
  return {
    nombre: diseno.nombre,
    forma: diseno.forma,
    medidasM: { ...diseno.medidasM },
    muebles: diseno.muebles.map((m) => ({ ...m })),
    materiales: diseno.materiales.map((m) => ({ ...m })),
  }
}
