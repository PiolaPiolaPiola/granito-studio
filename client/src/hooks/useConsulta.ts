import { useCallback, useEffect, useState } from 'react'
import { aErrorApi, type ErrorApi } from '../api/errores'

interface Resultado<T> {
  origen: () => Promise<T>
  version: number
  datos?: T
  error?: ErrorApi
}

export interface EstadoConsulta<T> {
  datos: T | undefined
  error: ErrorApi | undefined
  cargando: boolean
  recargar: () => void
}

/**
 * Ejecuta una consulta async y expone `datos / error / cargando`.
 * `consulta` debe estar memorizada (useCallback) con sus parámetros: cuando
 * cambia, se vuelve a consultar. "Cargando" se deduce comparando qué consulta
 * produjo el último resultado, así no hace falta un setState dentro del efecto.
 */
export function useConsulta<T>(consulta: () => Promise<T>): EstadoConsulta<T> {
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)

  useEffect(() => {
    let vigente = true
    consulta()
      .then((datos) => vigente && setResultado({ origen: consulta, version, datos }))
      .catch((e: unknown) => vigente && setResultado({ origen: consulta, version, error: aErrorApi(e) }))
    return () => {
      vigente = false
    }
  }, [consulta, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const actual = resultado?.origen === consulta && resultado.version === version
  return {
    datos: resultado?.datos,
    error: actual ? resultado.error : undefined,
    cargando: !actual,
    recargar,
  }
}
