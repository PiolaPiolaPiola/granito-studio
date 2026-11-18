import type { FormaCocina } from './diseno'

/** Pregunta que se le hace al motor de sugerencias. */
export interface ContextoSugerencia {
  forma: FormaCocina
  /** Granito que hoy tiene el mesón, para no repetirlo. */
  granitoActualId?: string
}

/** Combinación granito + color de muebles. */
export interface Sugerencia {
  titulo: string
  descripcion: string
  estilo: string
  granitoId: string
  colorMueblesHex: string
}
