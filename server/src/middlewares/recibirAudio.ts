import type { RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../errors/AppError.js';

const TAMANO_MAXIMO_MB = 15;

/**
 * Recibe un audio (nota de voz de WhatsApp, grabación del celular…) en memoria. Solo se
 * reenvía al transcriptor: no se guarda en disco.
 */
const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_MB * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (_req, archivo, aceptar) => {
    if (archivo.mimetype.startsWith('audio/') || archivo.mimetype === 'video/webm') {
      aceptar(null, true);
    } else {
      aceptar(new AppError(415, 'El archivo no es un audio'));
    }
  },
});

export function recibirAudio(campo: string): RequestHandler {
  const procesar = subida.single(campo);
  return (req, res, next) => {
    procesar(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        next(
          error.code === 'LIMIT_FILE_SIZE'
            ? new AppError(413, `El audio pesa más de ${String(TAMANO_MAXIMO_MB)} MB`)
            : new AppError(400, 'Envía un solo audio en el campo "audio"'),
        );
        return;
      }
      if (error) {
        next(error);
        return;
      }
      if (!req.file) {
        next(new AppError(400, 'Adjunta un audio en el campo "audio"'));
        return;
      }
      next();
    });
  };
}
