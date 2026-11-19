import type { Acabado, TipoPiedra } from '../dominio/granito'
import type { Espacio, MaterialMueble, TipoMueble } from '../dominio/mueble'

/** Lo que el análisis de una foto propone para el formulario de muebles (todo opcional). */
export interface SugerenciaMueble {
  nombre?: string
  espacio?: Espacio
  tipo?: TipoMueble
  material?: MaterialMueble
  colorHex?: string
  anchoCm?: number
  altoCm?: number
  fondoCm?: number
}

/** Lo que el análisis de una foto propone para el formulario de granitos. */
export interface SugerenciaGranito {
  nombre?: string
  tipo?: TipoPiedra
  acabado?: Acabado
  etiquetas?: string[]
}
