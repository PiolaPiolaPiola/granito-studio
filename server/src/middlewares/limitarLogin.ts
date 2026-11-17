import { rateLimit } from 'express-rate-limit';

const QUINCE_MINUTOS = 15 * 60 * 1000;

export const limitarLogin = rateLimit({
  windowMs: QUINCE_MINUTOS,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos' },
});
