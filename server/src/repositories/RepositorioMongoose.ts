import { isValidObjectId, type Model } from 'mongoose';
import type { ConId, Repositorio } from './repositorio.js';

export class RepositorioMongoose<
  T,
  TCrear extends Partial<T>,
  TActualizar extends Partial<T>,
> implements Repositorio<T, TCrear, TActualizar> {
  constructor(private readonly modelo: Model<T>) {}

  listar(): Promise<ConId<T>[]> {
    return this.modelo.find().sort({ creationAt: -1 }).lean<ConId<T>[]>().exec();
  }

  async buscarPorId(id: string): Promise<ConId<T> | null> {
    if (!isValidObjectId(id)) return null;
    return this.modelo.findById(id).lean<ConId<T>>().exec();
  }

  async crear(datos: TCrear): Promise<ConId<T>> {
    const documento = await this.modelo.create(datos);
    return documento.toObject<ConId<T>>();
  }

  async actualizar(id: string, cambios: TActualizar): Promise<ConId<T> | null> {
    if (!isValidObjectId(id)) return null;
    return this.modelo
      .findByIdAndUpdate(id, cambios, {
        returnDocument: 'after',
        runValidators: true,
      })
      .lean<ConId<T>>()
      .exec();
  }
}
