import { existsSync } from 'node:fs';
import { z } from 'zod';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const esquemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.url({ protocol: /^mongodb(\+srv)?$/ }),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.url(),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  console.error(`Variables de entorno inválidas:\n${z.prettifyError(resultado.error)}`);
  process.exit(1);
}

export const env = resultado.data;
