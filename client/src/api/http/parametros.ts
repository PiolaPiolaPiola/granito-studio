/** Quita los filtros vacíos para que no viajen como `?tipo=&busqueda=`. */
export function limpiarParametros<T extends object>(filtros: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>
}
