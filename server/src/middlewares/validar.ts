import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { ErrorValidacion, type DetalleValidacion } from '../errors/ErrorValidacion.js';

interface EsquemasSolicitud {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
}

const PARTES = ['params', 'query', 'body'] as const;

export function validar(esquemas: EsquemasSolicitud): RequestHandler {
  return (req, _res, next) => {
    const detalles: DetalleValidacion[] = [];

    for (const parte of PARTES) {
      const esquema = esquemas[parte];
      if (!esquema) continue;

      const resultado = esquema.safeParse(req[parte]);
      if (resultado.success) {
        Object.defineProperty(req, parte, {
          value: resultado.data,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        for (const issue of resultado.error.issues) {
          detalles.push({
            campo: [parte, ...issue.path.map(String)].join('.'),
            mensaje: issue.message,
          });
        }
      }
    }

    if (detalles.length > 0) {
      throw new ErrorValidacion(detalles);
    }

    next();
  };
}
