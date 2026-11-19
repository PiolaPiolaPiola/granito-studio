import { z } from 'zod'
import { ESPACIOS, MATERIALES_MUEBLE, TIPOS_MUEBLE, tipoPermitido } from '../dominio/mueble'

const medidaCm = z
  .number({ error: 'Escribe un número' })
  .min(1, 'Mínimo 1 cm')
  .max(500, 'Máximo 500 cm')

/** Espejo de `server/src/schemas/mueble.schemas.ts` (más la foto, que viaja como archivo). */
export const esquemaMueble = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
    espacio: z.enum(ESPACIOS),
    tipo: z.enum(TIPOS_MUEBLE),
    material: z.enum(MATERIALES_MUEBLE),
    colorHex: z.string().regex(/^#[0-9a-f]{6}$/i, 'Usa un color como #a1b2c3'),
    anchoCm: medidaCm,
    altoCm: medidaCm,
    fondoCm: medidaCm,
    imagen: z.custom<File>((v) => v instanceof File).optional(),
    quitarImagen: z.boolean(),
  })
  .refine((d) => tipoPermitido(d.espacio, d.tipo), {
    message: 'Ese tipo de mueble no corresponde al espacio elegido',
    path: ['tipo'],
  })

export type FormularioMueble = z.infer<typeof esquemaMueble>
