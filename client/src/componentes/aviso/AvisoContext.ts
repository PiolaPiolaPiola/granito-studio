import { createContext, useContext } from 'react'

export type Severidad = 'success' | 'error' | 'info' | 'warning'

export interface OpcionesAviso {
  /** Reemplaza el título por defecto ("Listo", "No se pudo"…). */
  titulo?: string
  /** Lista corta debajo del mensaje (por ejemplo, qué cambió o qué falló). */
  detalle?: string[]
}

export interface ValorAviso {
  mostrar(mensaje: string, severidad?: Severidad, opciones?: OpcionesAviso): void
}

export const AvisoContext = createContext<ValorAviso | null>(null)

export function useAviso(): ValorAviso {
  const valor = useContext(AvisoContext)
  if (valor === null) throw new Error('useAviso debe usarse dentro de <AvisoProvider>')
  return valor
}
