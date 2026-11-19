import { generarObjectId } from '../infra/generarId'
import type { ConTiempos } from './comun'
import type { Espacio } from './mueble'
import { objetosPorDefecto, type ObjetoReferencia } from './objetos'

/** `libre`: sin plantilla; cada mueble lleva su propia ubicación (x, z, giro). */
export const FORMAS_COCINA = ['lineal', 'L', 'U', 'isla', 'libre'] as const
export type FormaCocina = (typeof FORMAS_COCINA)[number]

export const ETIQUETA_FORMA: Record<FormaCocina, string> = {
  lineal: 'Lineal',
  L: 'En L',
  U: 'En U',
  isla: 'Con isla',
  libre: 'Libre',
}

export const SALPICADEROS = ['ninguno', 'bajo', 'completo'] as const
export type Salpicadero = (typeof SALPICADEROS)[number]

export const ETIQUETA_SALPICADERO: Record<Salpicadero, string> = {
  ninguno: 'Sin salpicadero',
  bajo: 'Bajo (10 cm)',
  completo: 'Completo',
}

export const ROTACIONES = [0, 90, 180, 270] as const
export type Rotacion = (typeof ROTACIONES)[number]

/** Detalles del trabajo en piedra (los mismos que cobra el taller). */
export interface AcabadosMeson {
  espesorCm: number
  salpicadero: Salpicadero
  /** La piedra baja por el costado de islas y barras hasta el piso. */
  cascada: boolean
}

export const ACABADOS_POR_DEFECTO: AcabadosMeson = { espesorCm: 3, salpicadero: 'bajo', cascada: false }

/** Medidas propias de la pieza en este diseño; lo que falte sale del catálogo. */
export interface MedidasPieza {
  ancho?: number
  alto?: number
  fondo?: number
}

/** Centro del mueble en metros y giro en grados (solo forma libre). */
export interface Ubicacion {
  x: number
  z: number
  rotacion: Rotacion
}

export const PIEZAS = ['meson', 'salpicadero', 'mueble'] as const
export type Pieza = (typeof PIEZAS)[number]

/** Un mueble colocado en un diseño. Se identifica por `_id` (no por nombre). */
export interface MuebleEnDiseno {
  _id: string
  mueble: string
  posicion: number
  medidasCm?: MedidasPieza
  ubicacion?: Ubicacion
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
  espacio: Espacio
  forma: FormaCocina
  medidasM: MedidasM
  acabados: AcabadosMeson
  muebles: MuebleEnDiseno[]
  materiales: MaterialAsignado[]
  /** Sofá, taza de baño, nevera…: dan escala, no se cotizan. */
  objetos: ObjetoReferencia[]
}

/** Lo que devuelve la API. Los diseños viejos pueden no traer `espacio` ni `acabados`. */
export interface Diseno extends ConTiempos, Omit<EntradaDiseno, 'espacio' | 'acabados' | 'objetos'> {
  espacio?: Espacio
  objetos?: ObjetoReferencia[]
  /** Foto del espacio real del cliente (se muestra detrás del 3D). */
  fondoUrl?: string
  acabados?: Partial<AcabadosMeson>
  /** Código del enlace público de solo lectura, si el diseño está compartido. */
  codigoPublico?: string
  /** Se muestra en la página de inicio pública. */
  destacado?: boolean
}

export function disenoVacio(espacio: Espacio = 'cocina'): EntradaDiseno {
  const medidasM = espacio === 'bano' ? { ancho: 2.2, fondo: 1.8 } : { ancho: 3.4, fondo: 2.6 }
  return {
    nombre: 'Nuevo diseño',
    espacio,
    forma: espacio === 'cocina' ? 'L' : 'lineal',
    medidasM,
    acabados: { ...ACABADOS_POR_DEFECTO },
    muebles: [],
    materiales: [],
    objetos: objetosPorDefecto(espacio, medidasM),
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
    acabados: { ...origen.acabados },
    objetos: origen.objetos.map((o) => ({ ...o, _id: generarObjectId(), ubicacion: { ...o.ubicacion } })),
    muebles: origen.muebles.map((m) => ({ ...copiarMueble(m), _id: nuevosIds.get(m._id) ?? m._id })),
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
    // Los diseños guardados antes de estos campos no los traen: valores por defecto.
    espacio: diseno.espacio ?? 'cocina',
    forma: diseno.forma,
    medidasM: { ...diseno.medidasM },
    acabados: { ...ACABADOS_POR_DEFECTO, ...diseno.acabados },
    muebles: diseno.muebles.map(copiarMueble),
    materiales: diseno.materiales.map((m) => ({ ...m })),
    objetos: (diseno.objetos ?? []).map((o) => ({ ...o, ubicacion: { ...o.ubicacion } })),
  }
}

/** Copia profunda de un mueble del diseño (medidas y ubicación son objetos). */
function copiarMueble({ medidasCm, ubicacion, ...resto }: MuebleEnDiseno): MuebleEnDiseno {
  return {
    ...resto,
    ...(medidasCm !== undefined ? { medidasCm: { ...medidasCm } } : {}),
    ...(ubicacion !== undefined ? { ubicacion: { ...ubicacion } } : {}),
  }
}

/** Cambia (o borra, con `undefined`) las medidas propias de una pieza. */
export function cambiarMedidasPieza(
  muebles: MuebleEnDiseno[],
  id: string,
  medidas: MedidasPieza | undefined,
): MuebleEnDiseno[] {
  return muebles.map((m) => {
    if (m._id !== id) return m
    const limpias = Object.fromEntries(Object.entries(medidas ?? {}).filter(([, v]) => v !== undefined && Number.isFinite(v)))
    const copia = { ...m }
    delete copia.medidasCm
    return Object.keys(limpias).length === 0 ? copia : { ...copia, medidasCm: limpias }
  })
}

/** Mueve (y/o gira) un mueble en la forma libre. Los valores se recortan al cuarto. */
export function ubicarMueble(
  muebles: MuebleEnDiseno[],
  id: string,
  ubicacion: Ubicacion,
  { ancho, fondo }: MedidasM,
): MuebleEnDiseno[] {
  const x = Math.min(ancho / 2, Math.max(-ancho / 2, ubicacion.x))
  const z = Math.min(fondo / 2, Math.max(-fondo / 2, ubicacion.z))
  const redondear = (v: number) => Math.round(v * 100) / 100
  return muebles.map((m) => (m._id === id ? { ...m, ubicacion: { x: redondear(x), z: redondear(z), rotacion: ubicacion.rotacion } } : m))
}
