import express, { Router } from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Sirve el cliente compilado (`client/dist`) desde el mismo servidor: en producción la app
 * entera vive en un solo dominio (sin CORS ni otra URL para la API). Si la carpeta no existe
 * (desarrollo, donde manda Vite, o pruebas), no hace nada.
 *
 * Las rutas de React (`/disenos/123`, `/p/abc`) no son archivos: a cualquier GET que pida HTML
 * y no sea de la API se le responde `index.html`, y React Router se encarga del resto.
 */
export function servirCliente(carpeta: string): Router {
  const rutas = Router();
  const raiz = path.resolve(carpeta);
  const indice = path.join(raiz, 'index.html');
  if (!existsSync(indice)) return rutas;

  // Lo de `assets/` lleva un hash en el nombre: nunca cambia, se cachea un año.
  rutas.use(
    '/assets',
    express.static(path.join(raiz, 'assets'), { immutable: true, maxAge: '1y', index: false }),
  );
  rutas.use(express.static(raiz, { index: false, maxAge: '1h' }));

  rutas.get(/.*/, (req, res, siguiente) => {
    const esApi = req.path.startsWith('/api') || req.path.startsWith('/uploads');
    if (esApi || !req.accepts('html')) {
      siguiente();
      return;
    }
    // index.html se revisa siempre: así cada despliegue llega sin que haya que limpiar caché.
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indice);
  });

  return rutas;
}
