import { env } from './config/env.js';

console.info(`Granito Studio API · entorno ${env.NODE_ENV} · puerto ${String(env.PORT)}`);
