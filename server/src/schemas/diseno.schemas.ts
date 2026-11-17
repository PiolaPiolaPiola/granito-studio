import { z } from 'zod';
import { FORMAS_COCINA, PIEZAS } from '../models/diseno.model.js';
import { idMongo, nombre } from './comunes.js';

const medidaM = z.number().min(0.5).max(20);

const esquemaMuebleEnDiseno = z.strictObject({
  _id: idMongo.optional(),
  mueble: idMongo,
  posicion: z.int().min(1),
});

const esquemaMaterial = z
  .strictObject({
    pieza: z.enum(PIEZAS),
    muebleEnDiseno: idMongo.optional(),
    granito: idMongo.optional(),
    colorHex: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, 'Usa un color como #a1b2c3')
      .optional(),
  })
  .refine((material) => (material.granito === undefined) !== (material.colorHex === undefined), {
    message: 'Elige un granito o un color (solo uno de los dos)',
    path: ['granito'],
  })
  .refine((material) => (material.pieza === 'mueble') === (material.muebleEnDiseno !== undefined), {
    message: 'muebleEnDiseno es obligatorio solo cuando la pieza es mueble',
    path: ['muebleEnDiseno'],
  });

export const esquemaDiseno = z
  .strictObject({
    nombre,
    forma: z.enum(FORMAS_COCINA),
    medidasM: z.strictObject({ ancho: medidaM, fondo: medidaM }),
    muebles: z.array(esquemaMuebleEnDiseno).max(50).default([]),
    materiales: z.array(esquemaMaterial).max(100).default([]),
  })
  .superRefine((diseno, ctx) => {
    const posiciones = new Set<number>();
    diseno.muebles.forEach((mueble, indice) => {
      if (posiciones.has(mueble.posicion)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ya hay otro mueble en esta posición',
          path: ['muebles', indice, 'posicion'],
        });
      }
      posiciones.add(mueble.posicion);
    });

    const idsMuebles = new Set(diseno.muebles.map((mueble) => mueble._id?.toLowerCase()));
    const piezasUsadas = new Set<string>();
    diseno.materiales.forEach((material, indice) => {
      const idMueble = material.muebleEnDiseno?.toLowerCase();

      if (idMueble !== undefined && !idsMuebles.has(idMueble)) {
        ctx.addIssue({
          code: 'custom',
          message: 'No hay un mueble con ese _id en este diseño',
          path: ['materiales', indice, 'muebleEnDiseno'],
        });
      }

      const clave = `${material.pieza}:${idMueble ?? ''}`;
      if (piezasUsadas.has(clave)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Esta pieza ya tiene un material asignado',
          path: ['materiales', indice, 'pieza'],
        });
      }
      piezasUsadas.add(clave);
    });
  });

export type EntradaDiseno = z.infer<typeof esquemaDiseno>;
