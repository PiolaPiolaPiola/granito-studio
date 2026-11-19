import { isValidObjectId, type Model, type QueryFilter } from 'mongoose';
import type { ConId, Pagina, Paginacion, Repositorio } from './repositorio.js';

/**
 * `TCrear` y `TActualizar` son los datos que llegan de la petición. No se exige que sean
 * `Partial<T>`: un diseño trae los ids como texto y Mongoose los convierte a ObjectId al guardar.
 */
export class RepositorioMongoose<
  T,
  TCrear extends object,
  TActualizar extends object,
> implements Repositorio<T, TCrear, TActualizar> {
  constructor(protected readonly modelo: Model<T>) {}

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

  async inactivar(id: string): Promise<ConId<T> | null> {
    if (!isValidObjectId(id)) return null;
    return this.modelo
      .findByIdAndUpdate(id, { active: false }, { returnDocument: 'after' })
      .lean<ConId<T>>()
      .exec();
  }

  /** Página de resultados (más recientes primero) y total de coincidencias, en paralelo. */
  protected async paginar(
    filtro: QueryFilter<T>,
    { pagina, porPagina }: Paginacion,
  ): Promise<Pagina<ConId<T>>> {
    const [elementos, total] = await Promise.all([
      this.modelo
        .find(filtro)
        .sort({ creationAt: -1, _id: -1 })
        .skip((pagina - 1) * porPagina)
        .limit(porPagina)
        .lean<ConId<T>[]>()
        .exec(),
      this.modelo.countDocuments(filtro).exec(),
    ]);

    return { elementos, total };
  }
}
