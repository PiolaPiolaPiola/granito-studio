import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { listarDestacados, verDisenoPublico } from '../controllers/diseno.controller.js';
import { listarPiedrasPublicas } from '../controllers/granito.controller.js';
import { validar } from '../middlewares/validar.js';

/**
 * Rutas SIN sesión: lo que puede ver un cliente con el enlace que le compartió el vendedor.
 * Solo lectura y con límite de peticiones (nadie debería pedir cientos por minuto).
 */
export const rutasPublicas = Router();

const limitarPublico = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { mensaje: 'Demasiadas peticiones seguidas. Espera un minuto.' },
});

const esquemaCodigo = z.strictObject({
  codigo: z.string().regex(/^[\w-]{16,64}$/, 'Código de enlace inválido'),
});

rutasPublicas.get('/destacados', limitarPublico, listarDestacados);
rutasPublicas.get('/piedras', limitarPublico, listarPiedrasPublicas);
rutasPublicas.get(
  '/disenos/:codigo',
  limitarPublico,
  validar({ params: esquemaCodigo }),
  verDisenoPublico,
);
