import { existsSync } from 'node:fs';
import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

type DurationJwt = NonNullable<SignOptions['expiresIn']>;

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

/** `CLAVE=` (vacía en el .env) cuenta como "no configurada". */
const claveOpcional = z.preprocess(
  (valor) => (valor === '' ? undefined : valor),
  z.string().min(1).optional(),
);

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
  UPLOADS_DIR: z.string().min(1).default('uploads'),

  // IA (opcional): sin ninguna clave, la app funciona igual y solo usa el análisis local.
  // Los nombres de modelos cambian seguido: se pueden ajustar sin tocar código.
  IA_ORDEN: z.string().default('gemini,groq,openrouter'),
  IA_GEMINI_API_KEY: claveOpcional,
  IA_GEMINI_MODELO: z.string().min(1).default('gemini-2.5-flash'),
  IA_GROQ_API_KEY: claveOpcional,
  IA_GROQ_MODELO: z.string().min(1).default('meta-llama/llama-4-scout-17b-16e-instruct'),
  IA_GROQ_MODELO_AUDIO: z.string().min(1).default('whisper-large-v3-turbo'),
  IA_OPENROUTER_API_KEY: claveOpcional,
  IA_OPENROUTER_MODELO: z.string().min(1).default('google/gemma-3-27b-it:free'),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  console.error(`Variables de entorno inválidas:\n${z.prettifyError(resultado.error)}`);
  process.exit(1);
}

export const env = resultado.data;
