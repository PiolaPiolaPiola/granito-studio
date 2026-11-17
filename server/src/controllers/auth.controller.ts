import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { iniciarSesion, obtenerPerfil } from '../services/auth.service.js';
import type { EntradaLogin } from '../schemas/auth.schemas.js';

export const login: RequestHandler = async (req, res) => {
  const { email, contrasena } = req.body as EntradaLogin;

  const resultado = await iniciarSesion(email, contrasena);
  res.json(resultado);
};

export const perfil: RequestHandler = async (req, res) => {
  if (!req.usuario) {
    throw new AppError(401, 'Debes iniciar sesión');
  }

  const usuario = await obtenerPerfil(req.usuario.sub);
  res.json({ usuario });
};
