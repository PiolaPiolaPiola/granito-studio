import type { PayloadToken } from '../services/auth.service.js';

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: PayloadToken;
  }
}
