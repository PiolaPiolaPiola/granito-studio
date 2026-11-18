export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  totalPaginas: number
}

export interface ParametrosPagina {
  pagina?: number
  limite?: number
}

export interface ConTiempos {
  _id: string
  creationAt: string
  updatedAt: string
}

/** Quita acentos y mayúsculas para búsquedas tolerantes ("marmol" encuentra "Mármol"). */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
