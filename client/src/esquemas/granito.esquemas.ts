import { z } from 'zod'
import { ACABADOS, parsearEtiquetas, TIPOS_PIEDRA } from '../dominio/granito'

/**
 * Valores del formulario de granito. Las etiquetas se escriben como un solo texto
 * separado por comas; `parsearEtiquetas` lo convierte al arreglo que espera la API.
 * Reglas espejo de `server/src/schemas/granito.schemas.ts`.
 */
export function crearEsquemaGranito(requiereImagen: boolean) {
  return z
    .object({
      nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
      tipo: z.enum(TIPOS_PIEDRA),
      acabado: z.enum(ACABADOS),
      etiquetasTexto: z.string().refine(
        (texto) => {
          const lista = parsearEtiquetas(texto)
          return lista.length <= 20 && lista.every((e) => e.length <= 30)
        },
        'Máximo 20 etiquetas de hasta 30 caracteres',
      ),
      imagen: z.custom<File>((v) => v instanceof File).optional(),
      /** Vacío = sin precio. Se escribe en pesos por m². */
      precioTexto: z.string().refine((t) => t.trim() === '' || (Number.isFinite(Number(t)) && Number(t) >= 0), 'Escribe un precio válido'),
    })
    .refine((d) => !requiereImagen || d.imagen !== undefined, {
      message: 'Selecciona la foto de la textura',
      path: ['imagen'],
    })
}

export type FormularioGranito = z.infer<ReturnType<typeof crearEsquemaGranito>>
