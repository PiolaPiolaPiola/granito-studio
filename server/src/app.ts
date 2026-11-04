import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { env } from './config/env.js';
import { manejadorErrores } from './middlewares/manejadorErrores.js';
import { noEncontrado } from './middlewares/noEncontrado.js';
import { rutasSalud } from './routes/salud.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', rutasSalud);

app.use(noEncontrado);
app.use(manejadorErrores);
