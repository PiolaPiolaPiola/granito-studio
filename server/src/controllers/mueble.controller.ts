import type { RequestHandler } from 'express';
import type { ActualizarMueble, CrearMueble, ListarMuebles } from '../schemas/mueble.schemas.js';
import { servicioMuebles } from '../services/mueble.service.js';

type ConParamId = RequestHandler<{ id: string }>;

export const listarMuebles: RequestHandler = async (req, res) => {
  const resultado = await servicioMuebles.listar(
    req.query as unknown as ListarMuebles,
    req.usuario?.rol === 'admin',
  );
  res.json(resultado);
};

export const obtenerMueble: ConParamId = async (req, res) => {
  const mueble = await servicioMuebles.obtener(req.params.id);
  res.json({ mueble });
};

export const crearMueble: RequestHandler = async (req, res) => {
  const mueble = await servicioMuebles.crear(req.body as CrearMueble);
  res.status(201).location(`/api/muebles/${mueble._id.toString()}`).json({ mueble });
};

export const actualizarMueble: ConParamId = async (req, res) => {
  const mueble = await servicioMuebles.actualizar(req.params.id, req.body as ActualizarMueble);
  res.json({ mueble });
};

export const inactivarMueble: ConParamId = async (req, res) => {
  await servicioMuebles.inactivar(req.params.id);
  res.status(204).end();
};
