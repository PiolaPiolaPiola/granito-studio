import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { env } from './config/env.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
