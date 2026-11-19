import { useCallback, useMemo } from 'react'
import { disenosApi } from '../../api'
import { aEntrada } from '../../dominio/diseno'
import { distribuir, type MuebleResuelto } from '../../escena/distribucion'
import { useConsulta } from '../../hooks/useConsulta'

/**
 * Carga un diseño compartido (por su código público) y calcula su distribución 3D.
 * Lo usan la página `/ver/:codigo` y la vista previa de la página de inicio.
 */
export function useDisenoPublico(codigo: string | undefined) {
  const consulta = useConsulta(
    useCallback(() => (codigo === undefined ? Promise.resolve(null) : disenosApi.verPublico(codigo)), [codigo]),
  )
  const datos = consulta.datos ?? null

  const vista = useMemo(() => {
    if (datos === null) return null
    const diseno = aEntrada(datos.diseno)
    const catalogo = new Map(datos.muebles.map((m) => [m._id, m]))
    const resueltos: MuebleResuelto[] = diseno.muebles.flatMap((m) => {
      const mueble = catalogo.get(m.mueble)
      return mueble === undefined ? [] : [{ _id: m._id, posicion: m.posicion, mueble, medidasCm: m.medidasCm, ubicacion: m.ubicacion }]
    })
    const { colocaciones } = distribuir(diseno.forma, diseno.medidasM, resueltos)
    return { diseno, colocaciones, granitos: datos.granitos }
  }, [datos])

  return { vista, cargando: consulta.cargando, error: consulta.error, recargar: consulta.recargar }
}
