import { isAxiosError } from 'axios'

export interface DetalleError {
  /** Ruta que manda el backend, p. ej. "body.materiales.0.granito". */
  campo: string
  mensaje: string
}

/**
 * Único tipo de error que ven las pantallas, venga de Axios o de un mock.
 * Así los componentes no dependen de la librería HTTP (se puede cambiar sin tocarlos).
 */
export class ErrorApi extends Error {
  readonly estado: number
  readonly detalles: DetalleError[]

  constructor(mensaje: string, estado: number, detalles: DetalleError[] = []) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.detalles = detalles
  }

  /** Alias en español de `message`. */
  get mensaje(): string {
    return this.message
  }
}

interface CuerpoError {
  mensaje?: string
  detalles?: DetalleError[]
}

export function aErrorApi(error: unknown): ErrorApi {
  if (error instanceof ErrorApi) return error
  if (isAxiosError<CuerpoError>(error)) {
    if (!error.response) return new ErrorApi('No se pudo conectar con el servidor', 0)
    const { status, data } = error.response
    return new ErrorApi(data?.mensaje ?? 'Ocurrió un error inesperado', status, data?.detalles ?? [])
  }
  return new ErrorApi(error instanceof Error ? error.message : 'Ocurrió un error inesperado', 0)
}
