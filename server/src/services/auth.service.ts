import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { UsuarioModelo, type Rol } from '../models/usuario.model.js';

const COSTO_HASH = 12;

const HASH_DE_RELLENO = bcrypt.hashSync('contrasena-de-relleno', COSTO_HASH);

export interface PayloadToken {
  sub: string;
  rol: Rol;
}

export function hashearContrasena(contrasena: string): Promise<string> {
  return bcrypt.hash(contrasena, COSTO_HASH);
}

export async function iniciarSesion(email: string, contrasena: string) {
  const usuario = await UsuarioModelo.findOne({ email }).select('+contrasenaHash');
  const coincide = await bcrypt.compare(contrasena, usuario?.contrasenaHash ?? HASH_DE_RELLENO);

  if (!usuario?.active || !coincide) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const payload: PayloadToken = { sub: usuario.id, rol: usuario.rol };
  const token = jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, usuario };
}
