import { z } from 'zod';

export const idMongo = z.string().regex(/^[0-9a-f]{24}$/i, 'Debe ser un id válido');

export const esquemaParamsId = z.strictObject({ id: idMongo });

export const emailNormalizado = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Escribe un email válido'));

export const nombre = z.string().trim().min(1).max(80);

export const urlArchivo = z.string().trim().min(1).max(500);

export function alMenosUnCampo(datos: object): boolean {
  return Object.keys(datos).length > 0;
}

export const MENSAJE_SIN_CAMPOS = 'Envía al menos un campo para actualizar';

export const esquemaPaginacion = z.strictObject({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export const colorHex = z.string().regex(/^#[0-9a-f]{6}$/i, 'Usa un color como #a1b2c3');

/** En multipart todo llega como texto; en JSON llega como booleano. */
export const booleanoFlexible = z.union([z.boolean(), z.stringbool()]);
