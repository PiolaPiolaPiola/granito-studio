import './config/zod.js';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import path from 'node:path';
import { env } from './config/env.js';
import { manejadorErrores } from './middlewares/manejadorErrores.js';
import { noEncontrado } from './middlewares/noEncontrado.js';
import { servirCliente } from './middlewares/servirCliente.js';
import { rutasSalud } from './routes/salud.routes.js';
import { rutasAuth } from './routes/auth.routes.js';
import { rutasGranitos } from './routes/granito.routes.js';
import { rutasMuebles } from './routes/mueble.routes.js';
import { rutasDisenos } from './routes/diseno.routes.js';
import { rutasSugerencias } from './routes/sugerencia.routes.js';
import { rutasDocs } from './routes/docs.routes.js';
import { rutasIa } from './routes/ia.routes.js';
import { rutasPublicas } from './routes/publico.routes.js';

export const app = express();

// En Render (y cualquier hosting con proxy) la IP real llega en X-Forwarded-For: sin esto,
// el límite de intentos de login vería a todos los usuarios como una sola IP.
if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Fotos subidas a Cloudinary, vistas previas locales (blob:) y texturas en data:.
        'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        // Audio grabado para los comandos de voz y el modelo .glb que se descarga.
        'media-src': ["'self'", 'blob:'],
        'connect-src': ["'self'", 'data:', 'blob:'],
        'worker-src': ["'self'", 'blob:'],
      },
    },
  }),
);
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

// Los nombres de archivo son UUID que nunca cambian: el navegador puede cachearlos sin revalidar.
app.use(
  '/uploads',
  express.static(path.resolve(env.UPLOADS_DIR), {
    index: false,
    dotfiles: 'deny',
    maxAge: '30d',
    immutable: true,
    setHeaders: (res) => {
      // Helmet pone same-origin; same-site deja usar la imagen desde el front en otro puerto.
      res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    },
  }),
);

app.use('/api/health', rutasSalud);
app.use('/api/auth', rutasAuth);
app.use('/api/granitos', rutasGranitos);
app.use('/api/muebles', rutasMuebles);
app.use('/api/disenos', rutasDisenos);
app.use('/api/sugerencias', rutasSugerencias);
app.use('/api/ia', rutasIa);
app.use('/api/publico', rutasPublicas);
app.use('/api/docs', rutasDocs);

// Producción: el mismo servidor entrega la app de React (en desarrollo la sirve Vite).
app.use(servirCliente(path.resolve(import.meta.dirname, '../../client/dist')));

app.use(noEncontrado);
app.use(manejadorErrores);
