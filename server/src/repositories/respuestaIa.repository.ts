import { RespuestaIaModelo } from '../models/respuestaIa.model.js';

export interface CacheIa {
  buscar(clave: string): Promise<{ datos: unknown; proveedor: string } | null>;
  guardar(clave: string, datos: unknown, proveedor: string): Promise<void>;
}

class CacheIaMongoose implements CacheIa {
  async buscar(clave: string) {
    return RespuestaIaModelo.findOne({ clave }).select('datos proveedor').lean().exec();
  }

  async guardar(clave: string, datos: unknown, proveedor: string) {
    // upsert: si dos peticiones iguales llegan juntas, no falla por la clave única.
    await RespuestaIaModelo.updateOne(
      { clave },
      { $setOnInsert: { clave, datos, proveedor } },
      { upsert: true },
    ).exec();
  }
}

export const cacheIa: CacheIa = new CacheIaMongoose();
