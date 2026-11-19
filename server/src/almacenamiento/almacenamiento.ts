import type { TipoImagen } from '../utils/imagen.js';

export interface ArchivoImagen {
  contenido: Buffer;
  tipo: TipoImagen;
}

/**
 * Puerto de almacenamiento de archivos. Los servicios dependen de esta interfaz,
 * no de un disco o una nube concretos (DIP). Cambiar a S3, Cloudinary o Azure Blob
 * es escribir otra clase que la implemente y cambiar una línea en `index.ts`.
 */
export interface AlmacenamientoArchivos {
  /** Guarda el archivo dentro de `carpeta` y devuelve la URL pública. */
  guardar(archivo: ArchivoImagen, carpeta: string): Promise<string>;
  /** Elimina el archivo de esa URL. No falla si ya no existe. */
  eliminar(url: string): Promise<void>;
}
