import { z } from 'zod';
import { ACABADOS, TIPOS_PIEDRA } from '../models/granito.model.js';
import {
  alMenosUnCampo,
  MENSAJE_SIN_CAMPOS,
  nombre,
  urlArchivo,
  esquemaPaginacion,
} from './comunes.js';

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
  .strictObject({ ...camposGranito, active: z.boolean() })
  .partial()
  .refine(alMenosUnCampo, MENSAJE_SIN_CAMPOS);

export type CrearGranito = z.infer<typeof esquemaCrearGranito>;
export type ActualizarGranito = z.infer<typeof esquemaActualizarGranito>;

export const esquemaListarGranitos = esquemaPaginacion.extend({
  busqueda: z.string().trim().min(1).max(80).optional(),
  tipo: z.enum(TIPOS_PIEDRA).optional(),
  acabado: z.enum(ACABADOS).optional(),
  etiqueta: z.string().trim().toLowerCase().min(1).max(30).optional(),
  incluirInactivos: z.stringbool().default(false),
});

export type ListarGranitos = z.infer<typeof esquemaListarGranitos>;
export type FiltrosGranitos = Omit<ListarGranitos, 'pagina' | 'porPagina'>;
