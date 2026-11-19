import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { imagenRecibida } from '../middlewares/recibirImagen.js';
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

export const compartirDiseno: ConParamId = async (req, res) => {
  const codigoPublico = await servicioDisenos.compartir(req.params.id);
  res.json({ codigoPublico });
};

export const dejarDeCompartirDiseno: ConParamId = async (req, res) => {
  await servicioDisenos.dejarDeCompartir(req.params.id);
  res.status(204).end();
};

export const cambiarFondoDiseno: ConParamId = async (req, res) => {
  const imagen = imagenRecibida(req);
  if (!imagen) throw new AppError(400, 'Adjunta la foto en el campo "imagen"');
  res.json({ diseno: await servicioDisenos.cambiarFondo(req.params.id, imagen) });
};

export const quitarFondoDiseno: ConParamId = async (req, res) => {
  res.json({ diseno: await servicioDisenos.cambiarFondo(req.params.id, null) });
};

export const destacarDiseno: ConParamId = async (req, res) => {
  const { destacado } = req.body as { destacado: boolean };
  res.json(await servicioDisenos.destacar(req.params.id, destacado));
};

/** Público, sin sesión: `GET /api/publico/destacados`. */
export const listarDestacados: RequestHandler = async (_req, res) => {
  res.json({ disenos: await servicioDisenos.listarDestacados() });
};

/** Público, sin sesión: `GET /api/publico/disenos/:codigo`. */
export const verDisenoPublico: RequestHandler<{ codigo: string }> = async (req, res) => {
  res.json(await servicioDisenos.obtenerPublico(req.params.codigo));
};

export const duplicarDiseno: ConParamId = async (req, res) => {
  const diseno = await servicioDisenos.duplicar(req.params.id);
  res.status(201).location(`/api/disenos/${diseno._id.toString()}`).json({ diseno });
};
