import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { UsuarioModelo } from '../src/models/usuario.model.js';
import { autorizacion, CONTRASENA, crearUsuario } from './ayudantes.js';

// Ojo: el límite de intentos permite 5 fallos por IP y este archivo comparte el contador.
// Aquí hay 4 logins fallidos; el límite se prueba aparte en limiteLogin.test.ts.

const secreto = () => process.env.JWT_SECRET ?? '';

describe('POST /api/auth/login', () => {
  it('devuelve un token y el usuario sin la contraseña', async () => {
    const { email } = await crearUsuario('admin');

    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ email: email.toUpperCase(), contrasena: CONTRASENA });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ usuario: { email, rol: 'admin' } });
    expect(respuesta.body).toHaveProperty('token');
    expect(JSON.stringify(respuesta.body)).not.toContain('contrasenaHash');
  });

  it('responde lo mismo con contraseña incorrecta y con email inexistente', async () => {
    const { email } = await crearUsuario('admin');

    const malaContrasena = await request(app)
      .post('/api/auth/login')
      .send({ email, contrasena: 'otra-clave' });
    const sinUsuario = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@granito.test', contrasena: CONTRASENA });

    expect(malaContrasena.status).toBe(401);
    expect(sinUsuario.status).toBe(401);
    // Mismo mensaje: no se puede averiguar qué emails existen (enumeración de usuarios).
    expect(malaContrasena.body).toEqual(sinUsuario.body);
  });

  it('rechaza a un usuario inactivo', async () => {
    const { email } = await crearUsuario('vendedor', { active: false });

    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ email, contrasena: CONTRASENA });

    expect(respuesta.status).toBe(401);
  });

  it('valida el cuerpo antes de consultar la base', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-email', contrasena: '' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toHaveProperty('detalles');
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve el perfil con un token válido', async () => {
    const cabecera = await autorizacion('vendedor');

    const respuesta = await request(app).get('/api/auth/me').set(cabecera);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ usuario: { rol: 'vendedor', active: true } });
  });

  it.each([
    ['sin cabecera', undefined],
    ['con otro esquema', 'Basic abc'],
    ['con un token mal formado', 'Bearer no-es-un-jwt'],
  ])('responde 401 %s', async (_caso, valor) => {
    const peticion = request(app).get('/api/auth/me');
    const respuesta = await (valor ? peticion.set('Authorization', valor) : peticion);

    expect(respuesta.status).toBe(401);
  });

  it('rechaza un token firmado con otro secreto', async () => {
    const { usuario } = await crearUsuario('admin');
    const falso = jwt.sign(
      { sub: usuario.id, rol: 'admin' },
      'otro-secreto-de-al-menos-32-caracteres!!',
    );

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${falso}`);

    expect(respuesta.status).toBe(401);
  });

  it('rechaza un token vencido', async () => {
    const { usuario } = await crearUsuario('admin');
    const vencido = jwt.sign({ sub: usuario.id, rol: 'admin' }, secreto(), { expiresIn: -10 });

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${vencido}`);

    expect(respuesta.status).toBe(401);
  });

  it('rechaza el token de un usuario que fue desactivado', async () => {
    const cabecera = await autorizacion('vendedor');
    await UsuarioModelo.updateMany({}, { active: false });

    const respuesta = await request(app).get('/api/auth/me').set(cabecera);

    expect(respuesta.status).toBe(401);
  });

  it('rechaza el token de un usuario que ya no existe', async () => {
    const token = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString(), rol: 'admin' },
      secreto(),
    );

    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(401);
  });
});

describe('autorizar(rol)', () => {
  const mueble = { nombre: 'Gabinete', tipo: 'inferior', anchoCm: 60, altoCm: 90, fondoCm: 60 };

  it('un vendedor puede leer pero no crear', async () => {
    const cabecera = await autorizacion('vendedor');

    const lectura = await request(app).get('/api/muebles').set(cabecera);
    const escritura = await request(app).post('/api/muebles').set(cabecera).send(mueble);

    expect(lectura.status).toBe(200);
    expect(escritura.status).toBe(403);
  });

  it('un admin puede crear', async () => {
    const cabecera = await autorizacion('admin');

    const respuesta = await request(app).post('/api/muebles').set(cabecera).send(mueble);

    expect(respuesta.status).toBe(201);
  });

  it('sin sesión no se puede leer el catálogo', async () => {
    const respuesta = await request(app).get('/api/granitos');

    expect(respuesta.status).toBe(401);
  });
});
