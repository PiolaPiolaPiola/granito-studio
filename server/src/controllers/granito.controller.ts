import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { imagenRecibida } from '../middlewares/recibirImagen.js';
import type {
  ActualizarGranito,
  CrearGranito,
  ListarGranitos,
} from '../schemas/granito.schemas.js';
import { servicioGranitos } from '../services/granito.service.js';

type ConParamId = RequestHandler<{ id: string }>;

export const listarGranitos: RequestHandler = async (req, res) => {
  const resultado = await servicioGranitos.listar(
    req.query as unknown as ListarGranitos,
    req.usuario?.rol === 'admin',
  );
  res.json(resultado);
};

/** Público, sin sesión: `GET /api/publico/piedras` (catálogo activo, sin precios). */
export const listarPiedrasPublicas: RequestHandler = async (_req, res) => {
  res.json({ piedras: await servicioGranitos.listarPublicas() });
};

export const obtenerGranito: ConParamId = async (req, res) => {
  const granito = await servicioGranitos.obtener(req.params.id);
  res.json({ granito });
};

export const crearGranito: RequestHandler = async (req, res) => {
  const imagen = imagenRecibida(req);
  if (!imagen) {
    throw new AppError(400, 'Adjunta una imagen en el campo "imagen"');
  }

  const granito = await servicioGranitos.crear(req.body as CrearGranito, imagen);
  res.status(201).location(`/api/granitos/${granito._id.toString()}`).json({ granito });
};

export const actualizarGranito: ConParamId = async (req, res) => {
  const granito = await servicioGranitos.actualizar(
    req.params.id,
    req.body as ActualizarGranito,
    imagenRecibida(req),
  );
  res.json({ granito });
};

export const inactivarGranito: ConParamId = async (req, res) => {
  await servicioGranitos.inactivar(req.params.id);
  res.status(204).end();
};
