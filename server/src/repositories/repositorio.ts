import type { Types } from 'mongoose';

export type ConId<T> = T & { _id: Types.ObjectId };

export interface Repositorio<T, TCrear, TActualizar> {
  listar(): Promise<ConId<T>[]>;
  buscarPorId(id: string): Promise<ConId<T> | null>;
  crear(datos: TCrear): Promise<ConId<T>>;
  actualizar(id: string, cambiosActualizar: TActualizar): Promise<ConId<T> | null>;
}
