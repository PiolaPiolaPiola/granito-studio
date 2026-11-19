import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { CONTRASENA, crearUsuario } from './ayudantes.js';

// Archivo propio: Vitest aísla los módulos por archivo, así que el contador empieza en cero.
describe('límite de intentos en el login', () => {
  it('bloquea la IP después de 5 intentos fallidos, incluso con la contraseña correcta', async () => {
    const { email } = await crearUsuario('admin');

    for (let intento = 1; intento <= 5; intento += 1) {
      const fallido = await request(app)
        .post('/api/auth/login')
        .send({ email, contrasena: 'incorrecta' });
      expect(fallido.status).toBe(401);
    }

    const bloqueado = await request(app)
      .post('/api/auth/login')
      .send({ email, contrasena: CONTRASENA });

    expect(bloqueado.status).toBe(429);
    expect(bloqueado.headers).toHaveProperty('ratelimit');
    expect(bloqueado.body).toHaveProperty('mensaje');
  });
});
