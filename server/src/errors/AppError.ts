export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/** Devuelve el valor o lanza un 404 con el mensaje dado (para resultados de `buscarPorId`, etc.). */
export function existeOFallar<T>(valor: T | null, mensaje: string): T {
  if (valor === null) {
    throw new AppError(404, mensaje);
  }
  return valor;
}
