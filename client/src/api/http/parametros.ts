import type { Pagina, ParametrosPagina } from '../../dominio/comun'

/** Quita los filtros vacíos para que no viajen como `?tipo=&busqueda=`. */
export function limpiarParametros<T extends object>(filtros: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>
}

/** El frontend habla de `limite`; el backend lo llama `porPagina`. */
export function parametrosPaginados<T extends ParametrosPagina>({ limite, ...resto }: T) {
  return limpiarParametros({ ...resto, porPagina: limite })
}

/** Metadatos que acompañan a toda lista paginada del backend. */
export interface MetadatosPagina {
  pagina: number
  porPagina: number
  total: number
  totalPaginas: number
}

/** `{ granitos: [...], pagina, total, ... }` → `Pagina<Granito>` del frontend. */
export function aPagina<T>(items: T[], { pagina, total, totalPaginas }: MetadatosPagina): Pagina<T> {
  return { items, pagina, total, totalPaginas }
}
