import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { imagenRecibida } from '../middlewares/recibirImagen.js';
import type { ContextoComando, Interpretar, TipoAnalisis } from '../schemas/ia.schemas.js';
import { servicioIa } from '../services/ia.service.js';

export const estadoIa: RequestHandler = (_req, res) => {
  res.json(servicioIa.estado());
};

export const analizarFoto: RequestHandler = async (req, res) => {
  const imagen = imagenRecibida(req);
  if (!imagen) throw new AppError(400, 'Adjunta una imagen en el campo "imagen"');
  const { tipo } = req.body as { tipo: TipoAnalisis };
  const { datos, proveedor, desdeCache } = await servicioIa.analizarFoto(tipo, imagen);
  res.json({ sugerencia: datos, proveedor, desdeCache });
};

export const analizarEspacio: RequestHandler = async (req, res) => {
  const imagen = imagenRecibida(req);
  if (!imagen) throw new AppError(400, 'Adjunta la foto en el campo "imagen"');
  const { contexto } = req.body as { contexto: ContextoComando };
  const { datos, proveedor, desdeCache } = await servicioIa.analizarEspacio(imagen, contexto);
  res.json({ acciones: datos.acciones, proveedor, desdeCache });
};

export const interpretarComando: RequestHandler = async (req, res) => {
  const { texto, contexto } = req.body as Interpretar;
  const { datos, proveedor, desdeCache } = await servicioIa.interpretarComando(texto, contexto);
  res.json({ acciones: datos.acciones, proveedor, desdeCache });
};

export const transcribirAudio: RequestHandler = async (req, res) => {
  const archivo = req.file;
  if (!archivo) throw new AppError(400, 'Adjunta un audio en el campo "audio"');
  const resultado = await servicioIa.transcribir({
    contenido: archivo.buffer,
    tipo: archivo.mimetype,
    nombre: archivo.originalname || 'audio',
  });
  res.json(resultado);
};
