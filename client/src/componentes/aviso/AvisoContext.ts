import { createContext, useContext } from 'react'

export type Severidad = 'success' | 'error' | 'info' | 'warning'

export interface ValorAviso {
  mostrar(mensaje: string, severidad?: Severidad): void
}

export const AvisoContext = createContext<ValorAviso | null>(null)

export function useAviso(): ValorAviso {
  const valor = useContext(AvisoContext)
  if (valor === null) throw new Error('useAviso debe usarse dentro de <AvisoProvider>')
  return valor
}
