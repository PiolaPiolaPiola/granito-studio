import type { ConTiempos, ParametrosPagina } from './comun'

/** Espejo de `server/src/models/mueble.model.ts`. */
export const ESPACIOS = ['cocina', 'sala', 'bano'] as const
export type Espacio = (typeof ESPACIOS)[number]

export const ETIQUETA_ESPACIO: Record<Espacio, string> = {
  cocina: 'Cocina',
  sala: 'Sala',
  bano: 'Baño',
}

export const TIPOS_MUEBLE = [
  'inferior',
  'superior',
  'isla',
  'alacena',
  'barra',
  'repisa',
  'lavamanos',
  'gabinete_bano',
  'mueble_tv',
  'biblioteca',
  'aparador',
] as const
export type TipoMueble = (typeof TIPOS_MUEBLE)[number]

export const ETIQUETA_TIPO_MUEBLE: Record<TipoMueble, string> = {
  inferior: 'Gabinetes inferiores',
  superior: 'Gabinetes superiores',
  isla: 'Islas',
  alacena: 'Alacenas',
  barra: 'Barras y penínsulas',
  repisa: 'Repisas',
  lavamanos: 'Muebles de lavamanos',
  gabinete_bano: 'Gabinetes de baño',
  mueble_tv: 'Muebles de TV',
  biblioteca: 'Bibliotecas',
  aparador: 'Aparadores',
}

/** Qué tipos tienen sentido en cada espacio (el backend rechaza el resto). */
export const TIPOS_POR_ESPACIO: Record<Espacio, readonly TipoMueble[]> = {
  cocina: ['inferior', 'superior', 'isla', 'alacena', 'barra', 'repisa'],
  bano: ['lavamanos', 'gabinete_bano', 'alacena', 'repisa'],
  sala: ['mueble_tv', 'biblioteca', 'aparador', 'barra', 'repisa'],
}

export function tipoPermitido(espacio: Espacio, tipo: TipoMueble): boolean {
  return TIPOS_POR_ESPACIO[espacio].includes(tipo)
}

export const MATERIALES_MUEBLE = ['madera', 'metal', 'lacado'] as const
export type MaterialMueble = (typeof MATERIALES_MUEBLE)[number]

export const ETIQUETA_MATERIAL: Record<MaterialMueble, string> = {
  madera: 'Madera',
  metal: 'Metal',
  lacado: 'Lacado',
}

/** Medidas típicas al elegir un tipo nuevo en el formulario (cm). */
export const MEDIDAS_TIPICAS: Record<TipoMueble, { anchoCm: number; altoCm: number; fondoCm: number }> = {
  inferior: { anchoCm: 80, altoCm: 90, fondoCm: 60 },
  superior: { anchoCm: 80, altoCm: 72, fondoCm: 35 },
  isla: { anchoCm: 180, altoCm: 90, fondoCm: 90 },
  alacena: { anchoCm: 90, altoCm: 210, fondoCm: 45 },
  barra: { anchoCm: 150, altoCm: 105, fondoCm: 45 },
  repisa: { anchoCm: 90, altoCm: 4, fondoCm: 25 },
  lavamanos: { anchoCm: 80, altoCm: 50, fondoCm: 48 },
  gabinete_bano: { anchoCm: 60, altoCm: 70, fondoCm: 15 },
  mueble_tv: { anchoCm: 180, altoCm: 50, fondoCm: 40 },
  biblioteca: { anchoCm: 100, altoCm: 200, fondoCm: 35 },
  aparador: { anchoCm: 150, altoCm: 80, fondoCm: 45 },
}

export interface Mueble extends ConTiempos {
  nombre: string
  /** Los muebles creados antes de esta versión pueden no traerlo: se asume cocina. */
  espacio?: Espacio
  tipo: TipoMueble
  material?: MaterialMueble
  colorHex?: string
  anchoCm: number
  altoCm: number
  fondoCm: number
  /** Foto del mueble real (catálogo y frente en 3D). */
  imagenUrl?: string
  active: boolean
}

export interface EntradaMueble {
  nombre: string
  espacio: Espacio
  tipo: TipoMueble
  material: MaterialMueble
  colorHex?: string
  anchoCm: number
  altoCm: number
  fondoCm: number
}

export interface FiltrosMuebles extends ParametrosPagina {
  busqueda?: string
  espacio?: Espacio
  tipo?: TipoMueble
  material?: MaterialMueble
}

export const espacioDe = (m: Pick<Mueble, 'espacio'>): Espacio => m.espacio ?? 'cocina'
export const materialDe = (m: Pick<Mueble, 'material'>): MaterialMueble => m.material ?? 'madera'

export function describirMedidas(m: Pick<Mueble, 'anchoCm' | 'altoCm' | 'fondoCm'>): string {
  return `${m.anchoCm} × ${m.altoCm} × ${m.fondoCm} cm`
}
