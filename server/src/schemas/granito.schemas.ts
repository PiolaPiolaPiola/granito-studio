import { z } from 'zod';
import { ACABADOS, TIPOS_PIEDRA } from '../models/granito.model.js';
import { alMenosUnCampo, MENSAJE_SIN_CAMPOS, nombre, urlArchivo } from './comunes.js';

const etiquetas = z
  .array(z.string().trim().toLowerCase().min(1).max(30))
  .max(20)
  .transform((lista) => [...new Set(lista)]);

const camposGranito = {
  nombre,
  tipo: z.enum(TIPOS_PIEDRA),
  acabado: z.enum(ACABADOS),
  imagenUrl: urlArchivo,
  etiquetas,
};

export const esquemaCrearGranito = z.strictObject({
  ...camposGranito,
  etiquetas: etiquetas.default([]),
});

export const esquemaActualizarGranito = z
  .strictObject(camposGranito)
  .partial()
  .refine(alMenosUnCampo, MENSAJE_SIN_CAMPOS);

export type CrearGranito = z.infer<typeof esquemaCrearGranito>;
export type ActualizarGranito = z.infer<typeof esquemaActualizarGranito>;
