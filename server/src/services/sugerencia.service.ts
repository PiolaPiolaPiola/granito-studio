import {
  repositorioGranitos,
  type RepositorioGranitos,
} from '../repositories/granito.repository.js';
import type { PedirSugerencias } from '../schemas/sugerencia.schemas.js';
import type { EstrategiaSugerencias } from '../sugerencias/estrategia.js';
import { ReglasPorEtiquetas } from '../sugerencias/ReglasPorEtiquetas.js';

/** Suficiente para el catálogo de una marmolería; si crece, la estrategia debería filtrar en la base. */
const TAMANO_CATALOGO = 500;

export class ServicioSugerencias {
  constructor(
    private readonly estrategia: EstrategiaSugerencias,
    private readonly granitos: RepositorioGranitos,
  ) {}

  async sugerir(contexto: PedirSugerencias) {
    const { elementos } = await this.granitos.buscar(
      { incluirInactivos: false },
      { pagina: 1, porPagina: TAMANO_CATALOGO },
    );
    return this.estrategia.sugerir(contexto, elementos);
  }
}

/** Composition root: para usar IA, se cambia ReglasPorEtiquetas por otra estrategia. */
export const servicioSugerencias = new ServicioSugerencias(
  new ReglasPorEtiquetas(),
  repositorioGranitos,
);
