import express from 'express';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { servirCliente } from '../src/middlewares/servirCliente.js';

let carpeta: string;
let app: express.Express;

beforeAll(async () => {
  carpeta = await mkdtemp(path.join(os.tmpdir(), 'granito-cliente-'));
  await mkdir(path.join(carpeta, 'assets'));
  await writeFile(path.join(carpeta, 'index.html'), '<div id="root"></div>');
  await writeFile(path.join(carpeta, 'assets', 'app-123.js'), 'console.log(1)');
  app = express();
  app.use(servirCliente(carpeta));
  app.use((_req, res) => res.status(404).json({ mensaje: 'no encontrado' }));
});

afterAll(async () => {
  await rm(carpeta, { recursive: true, force: true });
});

describe('servirCliente', () => {
  it('responde index.html en las rutas de React, sin caché', async () => {
    const res = await request(app).get('/disenos/123').set('Accept', 'text/html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="root"');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('sirve los assets con caché larga', async () => {
    const res = await request(app).get('/assets/app-123.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('deja pasar la API y lo que no pide HTML', async () => {
    const api = await request(app).get('/api/no-existe').set('Accept', 'text/html');
    expect(api.status).toBe(404);
    const json = await request(app).get('/otra').set('Accept', 'application/json');
    expect(json.status).toBe(404);
  });

  it('no hace nada si el cliente no está compilado', async () => {
    const sinCliente = express();
    sinCliente.use(servirCliente(path.join(carpeta, 'no-existe')));
    sinCliente.use((_req, res) => res.status(404).end());
    const res = await request(sinCliente).get('/').set('Accept', 'text/html');
    expect(res.status).toBe(404);
  });
});
