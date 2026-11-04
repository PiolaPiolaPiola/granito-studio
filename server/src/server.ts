import { app } from './app.js';
import { conectarBaseDatos } from './config/db.js';
import { env } from './config/env.js';

try {
  await conectarBaseDatos();

  app.listen(env.PORT, (error) => {
    if (error) {
      console.error(`No se pudo abrir el puerto ${String(env.PORT)}:`, error.message);
      process.exit(1);
    }
    console.info(`Granito Studio API · entorno ${env.NODE_ENV} · puerto ${String(env.PORT)}`);
  });
} catch (error) {
  console.error('No se pudo conectar a MongoDB:', error);
  process.exit(1);
}
