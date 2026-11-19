import type { FormaCocina } from '../models/diseno.model.js';
import type { Granito } from '../models/granito.model.js';
import type { ConId } from '../repositories/repositorio.js';

/** Lo que se sabe del diseño cuando se piden sugerencias. */
export interface ContextoSugerencia {
  forma: FormaCocina;
  /** Granito que hoy tiene el mesón: no se vuelve a sugerir. */
  granitoActualId?: string;
}

/** Una combinación granito + color de muebles, lista para mostrar en el editor. */
export interface Sugerencia {
  titulo: string;
  descripcion: string;
  estilo: string;
  granitoId: string;
  colorMueblesHex: string;
}

/**
 * Strategy: cualquier forma de sugerir combinaciones (reglas fijas hoy, un modelo de IA
 * mañana) implementa esta interfaz. El servicio no sabe cuál está usando.
 */
export interface EstrategiaSugerencias {
  sugerir(contexto: ContextoSugerencia, catalogo: ConId<Granito>[]): Promise<Sugerencia[]>;
}
