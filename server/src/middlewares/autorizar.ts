import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import type { Rol } from '../models/usuario.model.js';

export function autorizar(...rolesPermitidos: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.usuario) {
      throw new AppError(401, 'Debes iniciar sesión');
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      throw new AppError(403, 'No tienes permiso para esta acción');
    }

    next();
  };
}
