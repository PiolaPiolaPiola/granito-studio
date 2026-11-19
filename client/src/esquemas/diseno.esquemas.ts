import { z } from 'zod'
import { FORMAS_COCINA, PIEZAS, ROTACIONES, SALPICADEROS } from '../dominio/diseno'
import { ESPACIOS } from '../dominio/mueble'
import { TIPOS_OBJETO } from '../dominio/objetos'

const idMongo = z.string().regex(/^[0-9a-f]{24}$/i, 'Debe ser un id válido')

const medidaM = z
  .number({ error: 'Escribe un número' })
  .min(0.5, 'Mínimo 0.5 m')
  .max(20, 'Máximo 20 m')

const medidaCm = z.number().min(1, 'Mínimo 1 cm').max(500, 'Máximo 500 cm')

const esquemaMuebleEnDiseno = z.object({
  _id: idMongo,
  mueble: idMongo,
  posicion: z.int().min(1),
  medidasCm: z
    .object({ ancho: medidaCm.optional(), alto: medidaCm.optional(), fondo: medidaCm.optional() })
    .optional(),
  ubicacion: z
    .object({
      x: z.number().min(-20).max(20),
      z: z.number().min(-20).max(20),
      rotacion: z.union(ROTACIONES.map((r) => z.literal(r))),
    })
    .optional(),
})

const esquemaMaterial = z
  .object({
    pieza: z.enum(PIEZAS),
    muebleEnDiseno: idMongo.optional(),
    granito: idMongo.optional(),
    colorHex: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, 'Usa un color como #a1b2c3')
      .optional(),
  })
  .refine((m) => (m.granito === undefined) !== (m.colorHex === undefined), {
    message: 'Elige un granito o un color (solo uno de los dos)',
    path: ['granito'],
  })
  .refine((m) => (m.pieza === 'mueble') === (m.muebleEnDiseno !== undefined), {
    message: 'muebleEnDiseno es obligatorio solo cuando la pieza es mueble',
    path: ['muebleEnDiseno'],
  })

/**
 * Espejo de `server/src/schemas/diseno.schemas.ts`: validar en el cliente da
 * errores inmediatos; el servidor sigue siendo la fuente de verdad.
 * (Idea para después: moverlos a un paquete compartido y no duplicarlos.)
 */
export const esquemaDiseno = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
    espacio: z.enum(ESPACIOS),
    forma: z.enum(FORMAS_COCINA),
    medidasM: z.object({ ancho: medidaM, fondo: medidaM }),
    acabados: z.object({
      espesorCm: z.number({ error: 'Escribe un número' }).min(1, 'Mínimo 1 cm').max(10, 'Máximo 10 cm'),
      salpicadero: z.enum(SALPICADEROS),
      cascada: z.boolean(),
    }),
    muebles: z.array(esquemaMuebleEnDiseno).max(50, 'Máximo 50 muebles'),
    materiales: z.array(esquemaMaterial).max(100),
    entorno: z.object({
      pared: z.string().regex(/^#[0-9a-f]{6}$/i),
      piso: z.string().regex(/^#[0-9a-f]{6}$/i),
      techo: z.string().regex(/^#[0-9a-f]{6}$/i),
    }),
    objetos: z
      .array(
        z.object({
          _id: idMongo,
          tipo: z.enum(TIPOS_OBJETO),
          ubicacion: z.object({ x: z.number().min(-20).max(20), z: z.number().min(-20).max(20), rotacion: z.union(ROTACIONES.map((r) => z.literal(r))) }),
        }),
      )
      .max(30),
  })
  .superRefine((diseno, ctx) => {
    const posiciones = new Set<number>()
    diseno.muebles.forEach((m, i) => {
      if (posiciones.has(m.posicion)) {
        ctx.addIssue({ code: 'custom', message: 'Ya hay otro mueble en esta posición', path: ['muebles', i, 'posicion'] })
      }
      posiciones.add(m.posicion)
    })

    const ids = new Set(diseno.muebles.map((m) => m._id.toLowerCase()))
    const usadas = new Set<string>()
    diseno.materiales.forEach((m, i) => {
      const id = m.muebleEnDiseno?.toLowerCase()
      if (id !== undefined && !ids.has(id)) {
        ctx.addIssue({ code: 'custom', message: 'No hay un mueble con ese _id en este diseño', path: ['materiales', i, 'muebleEnDiseno'] })
      }
      const clave = `${m.pieza}:${id ?? ''}`
      if (usadas.has(clave)) {
        ctx.addIssue({ code: 'custom', message: 'Esta pieza ya tiene un material asignado', path: ['materiales', i, 'pieza'] })
      }
      usadas.add(clave)
    })
  })
