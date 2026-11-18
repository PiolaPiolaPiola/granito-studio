import { z } from 'zod'
import { TIPOS_MUEBLE } from '../dominio/mueble'

const medidaCm = z
  .number({ error: 'Escribe un número' })
  .min(1, 'Mínimo 1 cm')
  .max(500, 'Máximo 500 cm')

/** Espejo de `server/src/schemas/mueble.schemas.ts`. */
export const esquemaMueble = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
  tipo: z.enum(TIPOS_MUEBLE),
  anchoCm: medidaCm,
  altoCm: medidaCm,
  fondoCm: medidaCm,
})

export type FormularioMueble = z.infer<typeof esquemaMueble>
