import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('documentación OpenAPI', () => {
  it('publica el documento con todas las rutas', async () => {
    const respuesta = await request(app).get('/api/docs/openapi.json');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ openapi: '3.1.0' });
    expect(Object.keys((respuesta.body as { paths: object }).paths)).toEqual(
      expect.arrayContaining(['/api/granitos', '/api/disenos/{id}/duplicar', '/api/sugerencias']),
    );
  });

  it('sirve Swagger UI', async () => {
    const respuesta = await request(app).get('/api/docs/');

    expect(respuesta.status).toBe(200);
    expect(respuesta.text).toContain('swagger-ui');
  });
});
