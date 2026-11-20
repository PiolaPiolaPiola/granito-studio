import { createHash, randomUUID } from 'node:crypto';
import type { AlmacenamientoArchivos, ArchivoImagen } from './almacenamiento.js';

const CARPETA_VALIDA = /^[a-z0-9-]+$/;
const TIEMPO_MAXIMO_MS = 30_000;

export interface CredencialesCloudinary {
  nombreCloud: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Guarda las imágenes en Cloudinary (plan gratis) con su API REST: no hace falta el SDK.
 * Sirve en servidores sin disco permanente (Render gratis borra el disco en cada despliegue).
 * Todo queda dentro de la carpeta `raiz` de la cuenta, y solo se borra lo que está ahí.
 */
export class AlmacenamientoCloudinary implements AlmacenamientoArchivos {
  private readonly base: string;
  private readonly prefijoUrl: string;

  constructor(
    private readonly credenciales: CredencialesCloudinary,
    private readonly raiz = 'granito-studio',
  ) {
    this.base = `https://api.cloudinary.com/v1_1/${credenciales.nombreCloud}/image`;
    this.prefijoUrl = `https://res.cloudinary.com/${credenciales.nombreCloud}/image/upload/`;
  }

  async guardar({ contenido, tipo }: ArchivoImagen, carpeta: string): Promise<string> {
    if (!CARPETA_VALIDA.test(carpeta)) {
      throw new Error(`Carpeta de almacenamiento inválida: ${carpeta}`);
    }

    const formulario = this.firmar({
      public_id: randomUUID(),
      folder: `${this.raiz}/${carpeta}`,
    });
    formulario.append('file', new Blob([new Uint8Array(contenido)], { type: tipo }));

    const respuesta = await this.enviar('upload', formulario);
    if (typeof respuesta.secure_url !== 'string') {
      throw new Error('Cloudinary no devolvió la URL de la imagen');
    }
    return respuesta.secure_url;
  }

  async eliminar(url: string): Promise<void> {
    const idPublico = this.idPublicoDe(url);
    if (idPublico === null) return;
    // Si ya no existe, Cloudinary responde { result: 'not found' } sin error.
    await this.enviar('destroy', this.firmar({ public_id: idPublico }));
  }

  /** `https://res.cloudinary.com/<cloud>/image/upload/v123/granito-studio/x/uuid.jpg` → `granito-studio/x/uuid`. */
  private idPublicoDe(url: string): string | null {
    if (!url.startsWith(this.prefijoUrl)) return null;
    const ruta = url
      .slice(this.prefijoUrl.length)
      .replace(/^v\d+\//, '')
      .replace(/\.[a-z0-9]+$/i, '');
    return ruta.startsWith(`${this.raiz}/`) ? ruta : null;
  }

  /**
   * Firma de Cloudinary: los parámetros en orden alfabético (`a=1&b=2`) seguidos del secreto,
   * en SHA-1. El secreto nunca viaja; solo la firma.
   */
  private firmar(parametros: Record<string, string>): FormData {
    const conFecha = { ...parametros, timestamp: String(Math.floor(Date.now() / 1000)) };
    const texto = Object.keys(conFecha)
      .sort()
      .map((clave) => `${clave}=${conFecha[clave as keyof typeof conFecha]}`)
      .join('&');
    const firma = createHash('sha1')
      .update(texto + this.credenciales.apiSecret)
      .digest('hex');

    const formulario = new FormData();
    for (const [clave, valor] of Object.entries(conFecha)) formulario.append(clave, valor);
    formulario.append('api_key', this.credenciales.apiKey);
    formulario.append('signature', firma);
    return formulario;
  }

  private async enviar(accion: 'upload' | 'destroy', cuerpo: FormData) {
    const respuesta = await fetch(`${this.base}/${accion}`, {
      method: 'POST',
      body: cuerpo,
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    const datos = (await respuesta.json().catch(() => ({}))) as {
      secure_url?: unknown;
      error?: { message?: string };
    };
    if (!respuesta.ok) {
      const motivo = datos.error?.message ?? `HTTP ${String(respuesta.status)}`;
      throw new Error(`Cloudinary (${accion}): ${motivo}`);
    }
    return datos;
  }
}
