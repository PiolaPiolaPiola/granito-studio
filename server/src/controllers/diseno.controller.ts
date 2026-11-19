import type { RequestHandler } from 'express';
import type { EntradaDiseno } from '../schemas/diseno.schemas.js';
import { servicioDisenos } from '../services/diseno.service.js';

type ConParamId = RequestHandler<{ id: string }>;

export const listarDisenos: RequestHandler = async (_req, res) => {
  const disenos = await servicioDisenos.listar();
  res.json({ disenos });
};

export const obtenerDiseno: ConParamId = async (req, res) => {
  const diseno = await servicioDisenos.obtener(req.params.id);
  res.json({ diseno });
};

export const crearDiseno: RequestHandler = async (req, res) => {
  const diseno = await servicioDisenos.crear(req.body as EntradaDiseno);
  res.status(201).location(`/api/disenos/${diseno._id.toString()}`).json({ diseno });
};

export const reemplazarDiseno: ConParamId = async (req, res) => {
  const diseno = await servicioDisenos.reemplazar(req.params.id, req.body as EntradaDiseno);
  res.json({ diseno });
};

export const eliminarDiseno: ConParamId = async (req, res) => {
  await servicioDisenos.eliminar(req.params.id);
  res.status(204).end();
};
