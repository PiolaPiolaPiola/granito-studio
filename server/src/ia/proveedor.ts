import type { ArchivoImagen } from '../almacenamiento/index.js';

/**
 * PUERTO de inteligencia artificial: lo que la app necesita de cualquier proveedor
 * (Gemini, Groq, OpenRouter…). Los servicios dependen de esta interfaz, no de un SDK.
 */
export interface PeticionIa {
  /** Instrucciones del sistema: qué hacer y qué JSON devolver. */
  instrucciones: string;
  /** Texto del usuario (por ejemplo, un comando de voz ya transcrito). */
  texto?: string;
  imagen?: ArchivoImagen;
}

export interface ProveedorIa {
  readonly nombre: string;
  /** Devuelve el JSON que respondió el modelo (ya parseado, sin validar). */
  responderJson(peticion: PeticionIa): Promise<unknown>;
}

/** Proveedores que además transcriben audio (hoy: Groq con Whisper). */
export interface TranscriptorAudio {
  readonly nombre: string;
  transcribir(audio: { contenido: Buffer; tipo: string; nombre: string }): Promise<string>;
}

/**
 * Error de un proveedor. `pausaMs` dice cuánto tiempo no conviene volver a llamarlo
 * (cuota agotada, clave inválida, caída): así no se gastan peticiones que van a fallar.
 */
export class ErrorProveedorIa extends Error {
  constructor(
    readonly proveedor: string,
    message: string,
    readonly pausaMs: number,
  ) {
    super(message);
    this.name = 'ErrorProveedorIa';
  }
}

const MINUTO = 60_000;

/** Traduce el estado HTTP de un proveedor a cuánto pausarlo. */
export function pausaSegunEstado(estado: number, reintentarEnSegundos?: number): number {
  if (estado === 429) return (reintentarEnSegundos ?? 60) * 1000; // cuota o límite por minuto
  if (estado === 401 || estado === 403) return 30 * MINUTO; // clave mala: no insistir
  if (estado >= 500) return MINUTO; // caído
  return 0; // petición mala: el siguiente proveedor puede funcionar
}

/** Lee la cabecera `retry-after` (segundos) si viene. */
export function segundosDeEspera(cabeceras: Headers): number | undefined {
  const valor = Number(cabeceras.get('retry-after'));
  return Number.isFinite(valor) && valor > 0 ? valor : undefined;
}

/**
 * Los modelos a veces envuelven el JSON en ```json … ``` o agregan texto: se toma el
 * primer objeto JSON completo que aparezca.
 */
export function extraerJson(texto: string): unknown {
  const limpio = texto.trim();
  try {
    return JSON.parse(limpio);
  } catch {
    const inicio = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    if (inicio >= 0 && fin > inicio) return JSON.parse(limpio.slice(inicio, fin + 1));
    throw new Error('La respuesta no trae JSON');
  }
}

/** `fetch` con tiempo límite: un proveedor lento no debe colgar la petición del usuario. */
export async function pedirConLimite(url: string, opciones: RequestInit, limiteMs = 25_000) {
  return fetch(url, { ...opciones, signal: AbortSignal.timeout(limiteMs) });
}
