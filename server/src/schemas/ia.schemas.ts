import { z } from 'zod';
import { ESPACIOS } from '../models/mueble.model.js';

export const TIPOS_ANALISIS = ['mueble', 'granito'] as const;
export type TipoAnalisis = (typeof TIPOS_ANALISIS)[number];

/** Cuerpo de `POST /api/ia/analizar-foto` (multipart: este campo + el archivo `imagen`). */
export const esquemaAnalizarFoto = z.strictObject({ tipo: z.enum(TIPOS_ANALISIS) });

const nombres = (maximo: number) => z.array(z.string().trim().min(1).max(80)).max(maximo);

/** Lo que la IA necesita saber del diseño para entender un comando de voz. */
export const esquemaContextoComando = z.strictObject({
  espacio: z.enum(ESPACIOS),
  muebles: nombres(80),
  piedras: nombres(60),
});

/**
 * Cuerpo de `POST /api/ia/analizar-espacio` (multipart): el contexto llega como texto JSON
 * en el campo `contexto`, junto al archivo `imagen`.
 */
export const esquemaAnalizarEspacio = z.strictObject({
  contexto: z.preprocess((valor) => {
    if (typeof valor !== 'string') return valor;
    try {
      return JSON.parse(valor) as unknown;
    } catch {
      return valor;
    }
  }, esquemaContextoComando),
});

/** Cuerpo de `POST /api/ia/interpretar`. */
export const esquemaInterpretar = z.strictObject({
  texto: z.string().trim().min(2).max(500),
  contexto: esquemaContextoComando,
});

export type ContextoComando = z.infer<typeof esquemaContextoComando>;
export type Interpretar = z.infer<typeof esquemaInterpretar>;
