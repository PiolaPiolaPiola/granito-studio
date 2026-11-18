import type { ConTiempos, ParametrosPagina } from './comun'

export const TIPOS_PIEDRA = ['granito', 'marmol', 'cuarzo'] as const
export type TipoPiedra = (typeof TIPOS_PIEDRA)[number]

export const ACABADOS = ['brillante', 'mate'] as const
export type Acabado = (typeof ACABADOS)[number]

export const ETIQUETA_TIPO_PIEDRA: Record<TipoPiedra, string> = {
  granito: 'Granito',
  marmol: 'Mármol',
  cuarzo: 'Cuarzo',
}

export const ETIQUETA_ACABADO: Record<Acabado, string> = {
  brillante: 'Brillante',
  mate: 'Mate',
}

export interface Granito extends ConTiempos {
  nombre: string
  tipo: TipoPiedra
  acabado: Acabado
  imagenUrl: string
  etiquetas: string[]
  active: boolean
}

/** Lo que el usuario escribe al crear o editar (la imagen viaja aparte, como archivo). */
export interface EntradaGranito {
  nombre: string
  tipo: TipoPiedra
  acabado: Acabado
  etiquetas: string[]
}

export interface FiltrosGranitos extends ParametrosPagina {
  busqueda?: string
  tipo?: TipoPiedra
  acabado?: Acabado
  etiqueta?: string
}

/** "Negro, moderno,  moderno" → ["negro", "moderno"] (minúsculas, sin repetidos). */
export function parsearEtiquetas(texto: string): string[] {
  const limpias = texto
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0)
  return [...new Set(limpias)]
}
