import { existsSync } from 'node:fs';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

type DurationJwt = NonNullable<SignOptions['expiresIn']>;

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const esquemaEnv = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.url({ protocol: /^mongodb(\+srv)?$/ }),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'Usa un número y una unidad, por ejemplo 30m, 8h o 7d')
    .default('8h')
    .transform((valor) => valor as DurationJwt),
  CORS_ORIGIN: z.url(),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  console.error(`Variables de entorno inválidas:\n${z.prettifyError(resultado.error)}`);
  process.exit(1);
}

export const env = resultado.data;
