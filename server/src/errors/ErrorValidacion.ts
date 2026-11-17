import { AppError } from './AppError.js';

export interface DetalleValidacion {
  campo: string;
  mensaje: string;
}

export class ErrorValidacion extends AppError {
  readonly detalles: DetalleValidacion[];

  constructor(detalles: DetalleValidacion[]) {
    super(400, 'Los datos enviados no son válidos');
    this.name = 'ErrorValidacion';
    this.detalles = detalles;
  }
}
