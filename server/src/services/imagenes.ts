import type { AlmacenamientoArchivos, ArchivoImagen } from '../almacenamiento/index.js';

/**
 * Guarda la imagen y ejecuta la operación con su URL. Si la operación falla (por ejemplo, la
 * base rechaza el documento), borra la imagen recién guardada para no dejarla huérfana
 * (compensación). La usan granitos y muebles.
 */
export async function conImagenGuardada<T>(
  almacenamiento: AlmacenamientoArchivos,
  imagen: ArchivoImagen,
  carpeta: string,
  operacion: (url: string) => Promise<T>,
): Promise<T> {
  const url = await almacenamiento.guardar(imagen, carpeta);
  try {
    return await operacion(url);
  } catch (error) {
    await almacenamiento.eliminar(url);
    throw error;
  }
}

/** Borra una imagen que ya no se usa: si falla, se registra y la petición sigue. */
export async function eliminarSinFallar(
  almacenamiento: AlmacenamientoArchivos,
  url: string | undefined,
): Promise<void> {
  if (!url) return;
  try {
    await almacenamiento.eliminar(url);
  } catch (error) {
    console.error(`No se pudo borrar la imagen ${url}:`, error);
  }
}
