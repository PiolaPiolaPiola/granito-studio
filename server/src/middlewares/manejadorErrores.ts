import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';

function esErrorDeCliente(error: unknown): boolean {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  );
}

export const manejadorErrores: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ mensaje: error.message });
    return;
  }

  if (esErrorDeCliente(error)) {
    const { status } = error as Error & { status: number };
    res.status(status).json({ mensaje: 'La solicitud no es válida' });
    return;
  }

  console.error(error);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
};
