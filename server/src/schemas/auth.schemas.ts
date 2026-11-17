import { z } from 'zod';
import { emailNormalizado } from './comunes.js';

export const esquemaLogin = z.strictObject({
  email: emailNormalizado,
  contrasena: z.string().min(1).max(200),
});

export type EntradaLogin = z.infer<typeof esquemaLogin>;
