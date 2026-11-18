import type { ConTiempos, ParametrosPagina } from './comun'

export const TIPOS_MUEBLE = ['inferior', 'superior', 'isla', 'alacena'] as const
export type TipoMueble = (typeof TIPOS_MUEBLE)[number]

export const ETIQUETA_TIPO_MUEBLE: Record<TipoMueble, string> = {
  inferior: 'Gabinetes inferiores',
  superior: 'Gabinetes superiores',
  isla: 'Islas',
  alacena: 'Alacenas',
}

export interface Mueble extends ConTiempos {
  nombre: string
  tipo: TipoMueble
  anchoCm: number
  altoCm: number
  fondoCm: number
  miniaturaUrl?: string
  active: boolean
}

export interface EntradaMueble {
  nombre: string
  tipo: TipoMueble
  anchoCm: number
  altoCm: number
  fondoCm: number
}

export interface FiltrosMuebles extends ParametrosPagina {
  busqueda?: string
  tipo?: TipoMueble
}

export function describirMedidas(m: Pick<Mueble, 'anchoCm' | 'altoCm' | 'fondoCm'>): string {
  return `${m.anchoCm} × ${m.altoCm} × ${m.fondoCm} cm`
}
