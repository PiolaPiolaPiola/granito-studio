import type { FieldErrors, FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ErrorApi } from '../api/errores'

/**
 * Pasa los `detalles` de un 400 del backend a errores de campo de React Hook Form.
 * El backend manda rutas como "body.materiales.0.granito"; RHF usa "materiales.0.granito".
 * `alias` traduce campos que en el formulario se llaman distinto (p. ej. etiquetas → etiquetasTexto).
 * Devuelve cuántos errores se pudieron asignar.
 */
export function aplicarErroresApi<T extends FieldValues>(
  error: ErrorApi,
  setError: UseFormSetError<T>,
  alias: Record<string, string> = {},
): number {
  for (const detalle of error.detalles) {
    const ruta = detalle.campo.replace(/^body\./, '')
    setError((alias[ruta] ?? ruta) as Path<T>, { type: 'server', message: detalle.mensaje })
  }
  return error.detalles.length
}

/** Aplana el árbol de errores de RHF a una lista de mensajes (para campos sin input, como los arreglos). */
export function listarMensajes(errores: FieldErrors, prefijo = ''): string[] {
  const mensajes: string[] = []
  for (const [clave, valor] of Object.entries(errores)) {
    if (valor === null || typeof valor !== 'object') continue
    const ruta = prefijo === '' ? clave : `${prefijo}.${clave}`
    const { message } = valor as { message?: unknown }
    if (typeof message === 'string') mensajes.push(`${ruta}: ${message}`)
    else mensajes.push(...listarMensajes(valor as FieldErrors, ruta))
  }
  return mensajes
}
