import { createHash } from 'node:crypto';
import type { z } from 'zod';
import type { ArchivoImagen } from '../almacenamiento/index.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { CadenaProveedores } from '../ia/CadenaProveedores.js';
import {
  esquemaRespuestaComando,
  esquemaSugerenciaGranito,
  esquemaSugerenciaMueble,
  INSTRUCCIONES_GRANITO,
  INSTRUCCIONES_MUEBLE,
  instruccionesComando,
  VERSION_INSTRUCCIONES,
} from '../ia/instrucciones.js';
import { ProveedorCompatibleOpenAi } from '../ia/ProveedorCompatibleOpenAi.js';
import { ProveedorGemini } from '../ia/ProveedorGemini.js';
import type { PeticionIa, ProveedorIa, TranscriptorAudio } from '../ia/proveedor.js';
import { cacheIa, type CacheIa } from '../repositories/respuestaIa.repository.js';
import type { ContextoComando, TipoAnalisis } from '../schemas/ia.schemas.js';

export interface ResultadoIa<T> {
  datos: T;
  proveedor: string;
  desdeCache: boolean;
}

/**
 * Casos de uso de IA. Antes de gastar una petición mira la caché; después valida lo que
 * respondió el modelo y guarda solo respuestas válidas.
 */
export class ServicioIa {
  constructor(
    private readonly cadena: CadenaProveedores,
    private readonly cache: CacheIa,
    private readonly transcriptor: TranscriptorAudio | null,
  ) {}

  estado() {
    return {
      disponible: this.cadena.disponible,
      proveedores: this.cadena.nombres,
      transcribeAudio: this.transcriptor !== null,
    };
  }

  analizarFoto(tipo: TipoAnalisis, imagen: ArchivoImagen) {
    const esquema = tipo === 'mueble' ? esquemaSugerenciaMueble : esquemaSugerenciaGranito;
    const instrucciones = tipo === 'mueble' ? INSTRUCCIONES_MUEBLE : INSTRUCCIONES_GRANITO;
    const huellaImagen = createHash('sha256').update(imagen.contenido).digest('hex');
    return this.conCache(`foto:${tipo}:${huellaImagen}`, esquema, { instrucciones, imagen });
  }

  interpretarComando(texto: string, contexto: ContextoComando) {
    const normalizado = texto.trim().toLowerCase().replace(/\s+/g, ' ');
    return this.conCache(
      `comando:${normalizado}:${JSON.stringify(contexto)}`,
      esquemaRespuestaComando,
      { instrucciones: instruccionesComando(contexto), texto: normalizado },
    );
  }

  async transcribir(audio: { contenido: Buffer; tipo: string; nombre: string }) {
    if (this.transcriptor === null) {
      throw new AppError(503, 'Para transcribir audios hay que configurar IA_GROQ_API_KEY');
    }
    const texto = await this.transcriptor.transcribir(audio);
    if (texto === '') throw new AppError(422, 'No se entendió nada en el audio');
    return { texto, proveedor: this.transcriptor.nombre };
  }

  private async conCache<T extends z.ZodType>(
    descripcion: string,
    esquema: T,
    peticion: PeticionIa,
  ): Promise<ResultadoIa<z.output<T>>> {
    const clave = createHash('sha256')
      .update(`v${String(VERSION_INSTRUCCIONES)}:${descripcion}`)
      .digest('hex');

    const guardada = await this.cache.buscar(clave);
    if (guardada) {
      return {
        datos: esquema.parse(guardada.datos),
        proveedor: guardada.proveedor,
        desdeCache: true,
      };
    }

    const { datos, proveedor } = await this.cadena.responder(peticion);
    const validado = esquema.safeParse(datos);
    if (!validado.success) {
      throw new AppError(502, 'La IA respondió algo que no se pudo usar. Intenta de nuevo.');
    }
    await this.cache.guardar(clave, validado.data, proveedor);
    return { datos: validado.data, proveedor, desdeCache: false };
  }
}

/** Arma los proveedores configurados, en el orden de IA_ORDEN. */
function crearProveedores(): {
  proveedores: ProveedorIa[];
  transcriptor: TranscriptorAudio | null;
} {
  const disponibles = new Map<string, ProveedorIa>();
  let transcriptor: TranscriptorAudio | null = null;

  if (env.IA_GEMINI_API_KEY) {
    disponibles.set('gemini', new ProveedorGemini(env.IA_GEMINI_API_KEY, env.IA_GEMINI_MODELO));
  }
  if (env.IA_GROQ_API_KEY) {
    const groq = new ProveedorCompatibleOpenAi({
      nombre: 'Groq',
      urlBase: 'https://api.groq.com/openai/v1',
      apiKey: env.IA_GROQ_API_KEY,
      modelo: env.IA_GROQ_MODELO,
      modeloAudio: env.IA_GROQ_MODELO_AUDIO,
    });
    disponibles.set('groq', groq);
    transcriptor = groq;
  }
  if (env.IA_OPENROUTER_API_KEY) {
    disponibles.set(
      'openrouter',
      new ProveedorCompatibleOpenAi({
        nombre: 'OpenRouter',
        urlBase: 'https://openrouter.ai/api/v1',
        apiKey: env.IA_OPENROUTER_API_KEY,
        modelo: env.IA_OPENROUTER_MODELO,
      }),
    );
  }

  const orden = env.IA_ORDEN.split(',').map((n) => n.trim().toLowerCase());
  const proveedores = orden.flatMap((nombre) => {
    const proveedor = disponibles.get(nombre);
    return proveedor ? [proveedor] : [];
  });
  return { proveedores, transcriptor };
}

const { proveedores, transcriptor } = crearProveedores();

/** Composition root: para agregar un proveedor nuevo basta con otro adaptador aquí. */
export const servicioIa = new ServicioIa(new CadenaProveedores(proveedores), cacheIa, transcriptor);
