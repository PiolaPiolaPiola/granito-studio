import { z } from 'zod';
import { TIPOS_MUEBLE } from '../models/mueble.model.js';
import {
  alMenosUnCampo,
  esquemaPaginacion,
  MENSAJE_SIN_CAMPOS,
  nombre,
  urlArchivo,
} from './comunes.js';

const medidaCm = z.number().min(1).max(500);

const camposMueble = {
  nombre,
  tipo: z.enum(TIPOS_MUEBLE),
  anchoCm: medidaCm,
  altoCm: medidaCm,
  fondoCm: medidaCm,
  miniaturaUrl: urlArchivo.optional(),
};

export const esquemaCrearMueble = z.strictObject(camposMueble);

export const esquemaActualizarMueble = z
  .strictObject({ ...camposMueble, active: z.boolean() })
  .partial()
  .refine(alMenosUnCampo, MENSAJE_SIN_CAMPOS);

export const esquemaListarMuebles = esquemaPaginacion.extend({
  busqueda: z.string().trim().min(1).max(80).optional(),
  tipo: z.enum(TIPOS_MUEBLE).optional(),
  incluirInactivos: z.stringbool().default(false),
});

export type CrearMueble = z.infer<typeof esquemaCrearMueble>;
export type ActualizarMueble = z.infer<typeof esquemaActualizarMueble>;
export type ListarMuebles = z.infer<typeof esquemaListarMuebles>;
export type FiltrosMuebles = Omit<ListarMuebles, 'pagina' | 'porPagina'>;
