import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EXTENSIONES_IMAGEN } from '../utils/imagen.js';
import type { AlmacenamientoArchivos, ArchivoImagen } from './almacenamiento.js';

const CARPETA_VALIDA = /^[a-z0-9-]+$/;

/** Guarda los archivos en el disco del servidor y los expone bajo `prefijoUrl`. */
export class AlmacenamientoLocal implements AlmacenamientoArchivos {
  private readonly raiz: string;

  constructor(
    directorio: string,
    private readonly prefijoUrl = '/uploads',
  ) {
    this.raiz = path.resolve(directorio);
  }

  async guardar({ contenido, tipo }: ArchivoImagen, carpeta: string): Promise<string> {
    if (!CARPETA_VALIDA.test(carpeta)) {
      throw new Error(`Carpeta de almacenamiento inválida: ${carpeta}`);
    }

    const nombreArchivo = `${randomUUID()}.${EXTENSIONES_IMAGEN[tipo]}`;
    const directorio = path.join(this.raiz, carpeta);

    await mkdir(directorio, { recursive: true });
    await writeFile(path.join(directorio, nombreArchivo), contenido);

    return `${this.prefijoUrl}/${carpeta}/${nombreArchivo}`;
  }

  async eliminar(url: string): Promise<void> {
    if (!url.startsWith(`${this.prefijoUrl}/`)) return;

    const relativa = url.slice(this.prefijoUrl.length + 1);
    const ruta = path.resolve(this.raiz, relativa);

    if (!ruta.startsWith(this.raiz + path.sep)) return;

    await rm(ruta, { force: true });
  }
}
