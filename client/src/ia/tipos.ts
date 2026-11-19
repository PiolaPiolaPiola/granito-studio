import type { FormaCocina, Salpicadero } from '../dominio/diseno'
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

export interface EstadoIa {
  disponible: boolean
  proveedores: string[]
  transcribeAudio: boolean
}

export interface RespuestaIa {
  proveedor: string
  desdeCache: boolean
}

/**
 * Acción del editor pedida por voz (o por texto). Muebles y piedras van por NOMBRE: así la
 * misma acción sirve si la entendió el intérprete local o la IA; el editor busca el nombre
 * en su catálogo. Espejo de `server/src/ia/instrucciones.ts`.
 */
export type AccionVoz =
  | { tipo: 'agregar'; mueble: string; cantidad: number; anchoCm?: number }
  | { tipo: 'quitar'; mueble?: string }
  | { tipo: 'forma'; forma: FormaCocina }
  | { tipo: 'espacio'; espacio: Espacio }
  | { tipo: 'medidas'; ancho: number; fondo: number }
  | { tipo: 'piedra'; piedra: string; pieza: 'meson' | 'salpicadero' | 'ambos' }
  | { tipo: 'salpicadero'; valor: Salpicadero }
  | { tipo: 'cascada'; valor: boolean }
  | { tipo: 'espesor'; valor: number }
  | { tipo: 'colorMuebles'; color: string }

export interface ContextoComando {
  espacio: Espacio
  muebles: string[]
  piedras: string[]
}
