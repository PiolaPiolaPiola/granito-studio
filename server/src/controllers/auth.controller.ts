import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { iniciarSesion, obtenerPerfil } from '../services/auth.service.js';

const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  contrasena: z.string().min(1),
});

export const login: RequestHandler = async (req, res) => {
  const datos = esquemaLogin.safeParse(req.body);
  if (!datos.success) {
    throw new AppError(400, 'Email y contraseña válidos son obligatorios');
  }

  const resultado = await iniciarSesion(datos.data.email, datos.data.contrasena);
  res.json(resultado);
};

export const perfil: RequestHandler = async (req, res) => {
  if (!req.usuario) {
    throw new AppError(401, 'Debes iniciar sesión');
  }

  const usuario = await obtenerPerfil(req.usuario.sub);
  res.json({ usuario });
};
