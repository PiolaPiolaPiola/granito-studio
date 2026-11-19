import { z } from 'zod';
import {
  ESPACIOS,
  MATERIALES_MUEBLE,
  TIPOS_MUEBLE,
  tipoPermitido,
  type Espacio,
  type TipoMueble,
} from '../models/mueble.model.js';
import { booleanoFlexible, colorHex, esquemaPaginacion, nombre } from './comunes.js';

/** `coerce`: en multipart las medidas llegan como texto ("80"). */
const medidaCm = z.coerce.number().min(1).max(500);

const camposMueble = {
  nombre,
  espacio: z.enum(ESPACIOS),
  tipo: z.enum(TIPOS_MUEBLE),
  material: z.enum(MATERIALES_MUEBLE),
  colorHex,
  anchoCm: medidaCm,
  altoCm: medidaCm,
  fondoCm: medidaCm,
};

export const MENSAJE_TIPO_ESPACIO = 'Ese tipo de mueble no corresponde al espacio elegido';

function tipoEncaja(datos: { espacio?: Espacio; tipo?: TipoMueble }): boolean {
  return (
    datos.espacio === undefined ||
    datos.tipo === undefined ||
    tipoPermitido(datos.espacio, datos.tipo)
  );
}

/** Cuerpo de `POST /api/muebles` (JSON o multipart con la foto opcional en `imagen`). */
export const esquemaCrearMueble = z
  .strictObject({
    ...camposMueble,
    espacio: camposMueble.espacio.default('cocina'),
    material: camposMueble.material.default('madera'),
    colorHex: colorHex.optional(),
  })
  .refine(tipoEncaja, { message: MENSAJE_TIPO_ESPACIO, path: ['tipo'] });

/**
 * Cuerpo de `PATCH /api/muebles/:id`. Puede venir vacío si solo se cambia la foto; el
 * servicio comprueba que llegue algo y que tipo + espacio sigan encajando con lo guardado.
 */
export const esquemaActualizarMueble = z
  .strictObject({ ...camposMueble, active: booleanoFlexible, quitarImagen: booleanoFlexible })
  .partial()
  .refine(tipoEncaja, { message: MENSAJE_TIPO_ESPACIO, path: ['tipo'] });

export const esquemaListarMuebles = esquemaPaginacion.extend({
  busqueda: z.string().trim().min(1).max(80).optional(),
  espacio: z.enum(ESPACIOS).optional(),
  tipo: z.enum(TIPOS_MUEBLE).optional(),
  material: z.enum(MATERIALES_MUEBLE).optional(),
  incluirInactivos: z.stringbool().default(false),
});

export type CrearMueble = z.infer<typeof esquemaCrearMueble>;
export type ActualizarMueble = z.infer<typeof esquemaActualizarMueble>;
export type NuevoMueble = CrearMueble & { imagenUrl?: string };
/** `$unset` de la foto se expresa con `imagenUrl: undefined` en el repositorio. */
export type CambiosMueble = Omit<ActualizarMueble, 'quitarImagen'> & { imagenUrl?: string | null };
export type ListarMuebles = z.infer<typeof esquemaListarMuebles>;
export type FiltrosMuebles = Omit<ListarMuebles, 'pagina' | 'porPagina'>;
