import { conectarBaseDatos } from './config/db.js';
import { env } from './config/env.js';

try {
  await conectarBaseDatos();
  console.info(`Granito Studio API · entorno ${env.NODE_ENV} · puerto ${String(env.PORT)}`);
} catch (error) {
  console.error('No se pudo conectar a MongoDB:', error);
  process.exit(1);
}
