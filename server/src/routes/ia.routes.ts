import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import {
  analizarFoto,
  estadoIa,
  interpretarComando,
  transcribirAudio,
} from '../controllers/ia.controller.js';
import { autenticar } from '../middlewares/autenticar.js';
import { recibirAudio } from '../middlewares/recibirAudio.js';
import { recibirImagen } from '../middlewares/recibirImagen.js';
import { validar } from '../middlewares/validar.js';
import { esquemaAnalizarFoto, esquemaInterpretar } from '../schemas/ia.schemas.js';

export const rutasIa = Router();

rutasIa.use(autenticar);

/** Cuida la cuota gratuita: como mucho 20 peticiones de IA por minuto y por usuario. */
const limitarIa = rateLimit({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: (req) => req.usuario?.sub ?? 'anonimo',
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { mensaje: 'Demasiadas peticiones de IA seguidas. Espera un minuto.' },
});

rutasIa.get('/estado', estadoIa);
rutasIa.post(
  '/analizar-foto',
  limitarIa,
  recibirImagen('imagen'),
  validar({ body: esquemaAnalizarFoto }),
  analizarFoto,
);
rutasIa.post('/interpretar', limitarIa, validar({ body: esquemaInterpretar }), interpretarComando);
rutasIa.post('/transcribir', limitarIa, recibirAudio('audio'), transcribirAudio);
