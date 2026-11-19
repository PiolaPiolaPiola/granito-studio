import type { RequestHandler } from 'express';
import type { ActualizarGranito, CrearGranito } from '../schemas/granito.schemas.js';
import { servicioGranitos } from '../services/granito.service.js';

type ConParamId = RequestHandler<{ id: string }>;

export const listarGranitos: RequestHandler = async (_req, res) => {
  const granitos = await servicioGranitos.listar();
  res.json({ granitos });
};

export const obtenerGranito: ConParamId = async (req, res) => {
  const granito = await servicioGranitos.obtener(req.params.id);
  res.json({ granito });
};

export const crearGranito: RequestHandler = async (req, res) => {
  const granito = await servicioGranitos.crear(req.body as CrearGranito);
  res.status(201).location(`/api/granitos/${granito._id.toString()}`).json({ granito });
};

export const actualizarGranito: ConParamId = async (req, res) => {
  const granito = await servicioGranitos.actualizar(req.params.id, req.body as ActualizarGranito);
  res.json({ granito });
};
