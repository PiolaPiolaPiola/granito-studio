import { z } from 'zod';
import { FORMAS_COCINA } from '../models/diseno.model.js';
import { idMongo } from './comunes.js';

export const esquemaPedirSugerencias = z.strictObject({
  forma: z.enum(FORMAS_COCINA),
  granitoActualId: idMongo.optional(),
});

export type PedirSugerencias = z.infer<typeof esquemaPedirSugerencias>;
