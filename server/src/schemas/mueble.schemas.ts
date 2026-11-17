import { z } from 'zod';
import { TIPOS_MUEBLE } from '../models/mueble.model.js';
import { alMenosUnCampo, MENSAJE_SIN_CAMPOS, nombre, urlArchivo } from './comunes.js';

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
  .strictObject(camposMueble)
  .partial()
  .refine(alMenosUnCampo, MENSAJE_SIN_CAMPOS);

export type CrearMueble = z.infer<typeof esquemaCrearMueble>;
export type ActualizarMueble = z.infer<typeof esquemaActualizarMueble>;
