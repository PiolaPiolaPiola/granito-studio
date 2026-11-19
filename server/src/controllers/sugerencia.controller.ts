import type { RequestHandler } from 'express';
import type { PedirSugerencias } from '../schemas/sugerencia.schemas.js';
import { servicioSugerencias } from '../services/sugerencia.service.js';

export const pedirSugerencias: RequestHandler = async (req, res) => {
  const sugerencias = await servicioSugerencias.sugerir(req.query as unknown as PedirSugerencias);
  res.json({ sugerencias });
};
