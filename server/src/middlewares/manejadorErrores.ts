import type { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { ErrorValidacion } from '../errors/ErrorValidacion.js';
import { mongo } from 'mongoose';

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

  if (error instanceof ErrorValidacion) {
    res.status(error.statusCode).json({ mensaje: error.message, detalles: error.detalles });
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

  if (error instanceof mongo.MongoServerError && error.code === 11000) {
    res.status(409).json({ mensaje: 'Ya existe un registro con esos datos' });
    return;
  }

  console.error(error);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
};
