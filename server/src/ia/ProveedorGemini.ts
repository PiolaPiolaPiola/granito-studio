import {
  ErrorProveedorIa,
  extraerJson,
  pausaSegunEstado,
  pedirConLimite,
  segundosDeEspera,
  type PeticionIa,
  type ProveedorIa,
} from './proveedor.js';

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface RespuestaGemini {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** ADAPTADOR para Google Gemini (API REST `generateContent`, plan gratuito de AI Studio). */
export class ProveedorGemini implements ProveedorIa {
  readonly nombre = 'Gemini';

  constructor(
    private readonly apiKey: string,
    private readonly modelo: string,
  ) {}

  async responderJson({ instrucciones, texto, imagen }: PeticionIa): Promise<unknown> {
    const partes: Record<string, unknown>[] = [{ text: texto ?? 'Analiza la imagen.' }];
    if (imagen) {
      partes.push({
        inline_data: { mime_type: imagen.tipo, data: imagen.contenido.toString('base64') },
      });
    }

    const respuesta = await pedirConLimite(`${URL_BASE}/${this.modelo}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: instrucciones }] },
        contents: [{ role: 'user', parts: partes }],
        // Respuesta corta y en JSON: menos tokens gastados.
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!respuesta.ok) {
      throw new ErrorProveedorIa(
        this.nombre,
        `Gemini respondió ${String(respuesta.status)}`,
        pausaSegunEstado(respuesta.status, segundosDeEspera(respuesta.headers)),
      );
    }
    const datos = (await respuesta.json()) as RespuestaGemini;
    const textoRespuesta = datos.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    if (!textoRespuesta) throw new ErrorProveedorIa(this.nombre, 'Gemini no devolvió texto', 0);
    return extraerJson(textoRespuesta);
  }
}
