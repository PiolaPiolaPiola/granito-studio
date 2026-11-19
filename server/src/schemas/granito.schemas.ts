import { z } from 'zod';
import { ACABADOS, TIPOS_PIEDRA } from '../models/granito.model.js';
import { booleanoFlexible, esquemaPaginacion, nombre } from './comunes.js';

/**
 * Con multipart/form-data, una etiqueta llega como texto y varias como arreglo
 * (el campo se repite). Un texto vacío permite borrar todas las etiquetas.
 */
function comoArreglo(valor: unknown): unknown {
  if (valor === '') return [];
  return typeof valor === 'string' ? [valor] : valor;
}

const etiquetas = z.preprocess(
  comoArreglo,
  z
    .array(z.string().trim().toLowerCase().min(1).max(30))
    .max(20)
    .transform((lista) => [...new Set(lista)]),
);

const camposGranito = {
  nombre,
  tipo: z.enum(TIPOS_PIEDRA),
  acabado: z.enum(ACABADOS),
  etiquetas,
  /** Pesos por m². `coerce`: en multipart llega como texto. */
  precioM2: z.coerce.number().min(0).max(1_000_000_000).optional(),
};

/** Cuerpo de `POST /api/granitos`. La imagen llega aparte, en el campo de archivo `imagen`. */
export const esquemaCrearGranito = z.strictObject({
  ...camposGranito,
  etiquetas: etiquetas.default([]),
});

/**
 * Cuerpo de `PATCH /api/granitos/:id`. Puede venir vacío si solo se cambia la imagen;
 * el servicio comprueba que llegue al menos un campo o una imagen.
 */
export const esquemaActualizarGranito = z
  .strictObject({ ...camposGranito, active: booleanoFlexible })
  .partial();

export type CrearGranito = z.infer<typeof esquemaCrearGranito>;
export type ActualizarGranito = z.infer<typeof esquemaActualizarGranito>;

/** Lo que guarda el repositorio: los datos del formulario más la URL de la imagen ya subida. */
export type NuevoGranito = CrearGranito & { imagenUrl: string };
export type CambiosGranito = ActualizarGranito & { imagenUrl?: string };

export const esquemaListarGranitos = esquemaPaginacion.extend({
  busqueda: z.string().trim().min(1).max(80).optional(),
  tipo: z.enum(TIPOS_PIEDRA).optional(),
  acabado: z.enum(ACABADOS).optional(),
  etiqueta: z.string().trim().toLowerCase().min(1).max(30).optional(),
  incluirInactivos: z.stringbool().default(false),
});

export type ListarGranitos = z.infer<typeof esquemaListarGranitos>;
export type FiltrosGranitos = Omit<ListarGranitos, 'pagina' | 'porPagina'>;
