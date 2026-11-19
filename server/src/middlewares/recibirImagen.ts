import type { RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../errors/AppError.js';
import { detectarTipoImagen, esTipoImagen } from '../utils/imagen.js';

const TAMANO_MAXIMO_MB = 5;

const subida = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_MB * 1024 * 1024, files: 1, fields: 20 },
  fileFilter: (_req, archivo, decidir) => {
    if (esTipoImagen(archivo.mimetype)) {
      decidir(null, true);
    } else {
      decidir(new AppError(415, 'Solo se aceptan imágenes JPG, PNG o WEBP'));
    }
  },
});

function traducirErrorMulter(error: multer.MulterError): AppError {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new AppError(413, `La imagen no puede pesar más de ${String(TAMANO_MAXIMO_MB)} MB`);
    case 'LIMIT_FILE_COUNT':
      return new AppError(400, 'Envía una sola imagen');
    case 'LIMIT_UNEXPECTED_FILE':
      return new AppError(400, `Campo de archivo inesperado: "${error.field ?? ''}"`);
    default:
      return new AppError(400, 'No se pudo procesar el archivo enviado');
  }
}

interface OpcionesImagen {
  obligatoria?: boolean;
}

/**
 * Recibe una imagen en `multipart/form-data` (campo `campo`) y la deja en `req.file`.
 * Valida el tamaño, el tipo declarado y la firma real del archivo (magic bytes).
 */
export function recibirImagen(
  campo: string,
  { obligatoria = true }: OpcionesImagen = {},
): RequestHandler {
  const procesar = subida.single(campo);

  return (req, res, next) => {
    procesar(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError) {
        next(traducirErrorMulter(error));
        return;
      }
      if (error) {
        next(error);
        return;
      }

      if (!req.file) {
        next(
          obligatoria ? new AppError(400, `Adjunta una imagen en el campo "${campo}"`) : undefined,
        );
        return;
      }

      if (detectarTipoImagen(req.file.buffer) !== req.file.mimetype) {
        next(new AppError(415, 'El archivo no es una imagen válida'));
        return;
      }

      next();
    });
  };
}
