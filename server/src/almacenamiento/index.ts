import { env } from '../config/env.js';
import type { AlmacenamientoArchivos } from './almacenamiento.js';
import { AlmacenamientoCloudinary } from './AlmacenamientoCloudinary.js';
import { AlmacenamientoLocal } from './AlmacenamientoLocal.js';

export type { AlmacenamientoArchivos, ArchivoImagen } from './almacenamiento.js';

/**
 * Composition root: aquí se decide qué implementación usa toda la app.
 * Con las credenciales de Cloudinary, las imágenes van a la nube (producción en Render,
 * cuyo disco gratis se borra en cada despliegue); sin ellas, al disco local (desarrollo).
 */
function crearAlmacenamiento(): AlmacenamientoArchivos {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;
  if (
    CLOUDINARY_CLOUD_NAME !== undefined &&
    CLOUDINARY_API_KEY !== undefined &&
    CLOUDINARY_API_SECRET !== undefined
  ) {
    return new AlmacenamientoCloudinary({
      nombreCloud: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      apiSecret: CLOUDINARY_API_SECRET,
    });
  }
  return new AlmacenamientoLocal(env.UPLOADS_DIR);
}

export const almacenamiento: AlmacenamientoArchivos = crearAlmacenamiento();
