import {
  ErrorProveedorIa,
  extraerJson,
  pausaSegunEstado,
  pedirConLimite,
  segundosDeEspera,
  type PeticionIa,
  type ProveedorIa,
  type TranscriptorAudio,
} from './proveedor.js';

interface RespuestaChat {
  choices?: { message?: { content?: string } }[];
}

interface Opciones {
  nombre: string;
  /** p. ej. https://api.groq.com/openai/v1 o https://openrouter.ai/api/v1 */
  urlBase: string;
  apiKey: string;
  modelo: string;
  /** Modelo de transcripción (solo si el proveedor lo ofrece, como Groq con Whisper). */
  modeloAudio?: string;
}

/**
 * ADAPTADOR para cualquier proveedor con la API de chat de OpenAI (`/chat/completions`):
 * Groq y OpenRouter la implementan, así que un solo adaptador sirve para los dos.
 */
export class ProveedorCompatibleOpenAi implements ProveedorIa, TranscriptorAudio {
  readonly nombre: string;

  constructor(private readonly opciones: Opciones) {
    this.nombre = opciones.nombre;
  }

  get transcribeAudio(): boolean {
    return this.opciones.modeloAudio !== undefined;
  }

  async responderJson({ instrucciones, texto, imagen }: PeticionIa): Promise<unknown> {
    const contenido: Record<string, unknown>[] = [
      { type: 'text', text: texto ?? 'Analiza la imagen.' },
    ];
    if (imagen) {
      const datos = imagen.contenido.toString('base64');
      contenido.push({
        type: 'image_url',
        image_url: { url: `data:${imagen.tipo};base64,${datos}` },
      });
    }

    const respuesta = await pedirConLimite(`${this.opciones.urlBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.opciones.apiKey}`,
      },
      body: JSON.stringify({
        model: this.opciones.modelo,
        messages: [
          { role: 'system', content: instrucciones },
          { role: 'user', content: contenido },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!respuesta.ok) {
      throw new ErrorProveedorIa(
        this.nombre,
        `${this.nombre} respondió ${String(respuesta.status)}`,
        pausaSegunEstado(respuesta.status, segundosDeEspera(respuesta.headers)),
      );
    }
    const datos = (await respuesta.json()) as RespuestaChat;
    const textoRespuesta = datos.choices?.[0]?.message?.content;
    if (!textoRespuesta) {
      throw new ErrorProveedorIa(this.nombre, `${this.nombre} no devolvió texto`, 0);
    }
    return extraerJson(textoRespuesta);
  }

  async transcribir(audio: { contenido: Buffer; tipo: string; nombre: string }): Promise<string> {
    const { modeloAudio } = this.opciones;
    if (modeloAudio === undefined) {
      throw new ErrorProveedorIa(this.nombre, `${this.nombre} no transcribe audio`, 0);
    }
    const formulario = new FormData();
    formulario.append(
      'file',
      new Blob([new Uint8Array(audio.contenido)], { type: audio.tipo }),
      audio.nombre,
    );
    formulario.append('model', modeloAudio);
    formulario.append('language', 'es');
    formulario.append('response_format', 'json');

    const respuesta = await pedirConLimite(
      `${this.opciones.urlBase}/audio/transcriptions`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${this.opciones.apiKey}` },
        body: formulario,
      },
      60_000,
    );
    if (!respuesta.ok) {
      throw new ErrorProveedorIa(
        this.nombre,
        `${this.nombre} no pudo transcribir (${String(respuesta.status)})`,
        pausaSegunEstado(respuesta.status, segundosDeEspera(respuesta.headers)),
      );
    }
    const { text } = (await respuesta.json()) as { text?: string };
    return (text ?? '').trim();
  }
}
