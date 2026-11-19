import { model, Schema } from 'mongoose';

/**
 * Caché de respuestas de IA: la misma foto (o el mismo comando) no se vuelve a enviar a un
 * proveedor gratuito. La clave es un hash SHA-256 de lo que se pidió; Mongo borra las
 * entradas viejas solo (índice TTL).
 */
export interface RespuestaIa {
  clave: string;
  datos: unknown;
  proveedor: string;
  creationAt: Date;
}

const TREINTA_DIAS_S = 30 * 24 * 60 * 60;

const esquemaRespuestaIa = new Schema<RespuestaIa>(
  {
    clave: { type: String, required: true },
    datos: { type: Schema.Types.Mixed, required: true },
    proveedor: { type: String, required: true },
  },
  { timestamps: { createdAt: 'creationAt', updatedAt: false }, versionKey: false },
);

esquemaRespuestaIa.index({ clave: 1 }, { unique: true });
esquemaRespuestaIa.index({ creationAt: 1 }, { expireAfterSeconds: TREINTA_DIAS_S });

export const RespuestaIaModelo = model<RespuestaIa>(
  'RespuestaIa',
  esquemaRespuestaIa,
  'respuestas_ia',
);
