import type { Paginacion } from '../repositories/repositorio.js';

/** Metadatos que el frontend necesita para dibujar el paginador. */
export function metadatosPagina(total: number, { pagina, porPagina }: Paginacion) {
  return { pagina, porPagina, total, totalPaginas: Math.ceil(total / porPagina) };
}
