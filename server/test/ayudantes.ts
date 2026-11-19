import request from 'supertest';
import { app } from '../src/app.js';
import { UsuarioModelo, type Rol } from '../src/models/usuario.model.js';
import { hashearContrasena } from '../src/services/auth.service.js';

export const CONTRASENA = 'Clave-de-prueba-123';

let contador = 0;

/** Crea un usuario directamente en la base (no hay registro público). */
export async function crearUsuario(rol: Rol = 'admin', { active = true } = {}) {
  contador += 1;
  const email = `${rol}${String(contador)}@granito.test`;
  const usuario = await UsuarioModelo.create({
    email,
    contrasenaHash: await hashearContrasena(CONTRASENA),
    rol,
    active,
  });
  return { usuario, email };
}

/** Crea un usuario con ese rol, inicia sesión por la API y devuelve la cabecera Authorization. */
export async function autorizacion(rol: Rol = 'admin') {
  const { email } = await crearUsuario(rol);
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ email, contrasena: CONTRASENA });
  const { token } = respuesta.body as { token: string };
  return { Authorization: `Bearer ${token}` };
}

export const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
export const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
