import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { documentoOpenApi } from '../docs/openapi.js';

export const rutasDocs = Router();

rutasDocs.get('/openapi.json', (_req, res) => {
  res.json(documentoOpenApi);
});

rutasDocs.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(documentoOpenApi, {
    customSiteTitle: 'Granito Studio API',
    swaggerOptions: { persistAuthorization: true },
  }),
);
