import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('GET /api/health', () => {
  it('responde ok con la base conectada', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ estado: 'ok', baseDatos: 'conectada' });
  });

  it('usa la base de pruebas, no la de desarrollo', async () => {
    const { default: mongoose } = await import('mongoose');
    expect(mongoose.connection.name).toMatch(/^granito_test_/);
  });
});
