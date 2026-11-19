import type { Types } from 'mongoose';

export type ConId<T> = T & { _id: Types.ObjectId };

export interface Repositorio<T, TCrear, TActualizar> {
  listar(): Promise<ConId<T>[]>;
  buscarPorId(id: string): Promise<ConId<T> | null>;
  crear(datos: TCrear): Promise<ConId<T>>;
  actualizar(id: string, cambiosActualizar: TActualizar): Promise<ConId<T> | null>;
  inactivar(id: string): Promise<ConId<T> | null>;
  /** De los ids dados, los que sí existen (en minúsculas). */
  idsExistentes(ids: string[]): Promise<Set<string>>;
}

export interface Paginacion {
  pagina: number;
  porPagina: number;
}

export interface Pagina<T> {
  elementos: T[];
  total: number;
}
