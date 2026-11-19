import { env } from '../config/env.js';
import type { AlmacenamientoArchivos } from './almacenamiento.js';
import { AlmacenamientoLocal } from './AlmacenamientoLocal.js';

export type { AlmacenamientoArchivos, ArchivoImagen } from './almacenamiento.js';

/** Composition root: aquí se decide qué implementación usa toda la app. */
export const almacenamiento: AlmacenamientoArchivos = new AlmacenamientoLocal(env.UPLOADS_DIR);
