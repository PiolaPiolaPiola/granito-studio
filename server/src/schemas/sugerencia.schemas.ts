import { z } from 'zod';
import { FORMAS_COCINA } from '../models/diseno.model.js';
import { ESPACIOS } from '../models/mueble.model.js';
import { idMongo } from './comunes.js';

export const esquemaPedirSugerencias = z.strictObject({
  forma: z.enum(FORMAS_COCINA),
  espacio: z.enum(ESPACIOS).default('cocina'),
  granitoActualId: idMongo.optional(),
});

export type PedirSugerencias = z.infer<typeof esquemaPedirSugerencias>;
