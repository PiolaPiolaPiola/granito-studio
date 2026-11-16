import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { verificarToken } from '../services/auth.service.js';

export const autenticar: RequestHandler = (req, _res, next) => {
  const [esquema, token] = req.headers.authorization?.split(' ') ?? [];

  if (esquema !== 'Bearer' || !token) {
    throw new AppError(401, 'Debes iniciar sesión');
  }

  req.usuario = verificarToken(token);
  next();
};
