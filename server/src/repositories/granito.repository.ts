import { GranitoModelo, type Granito } from '../models/granito.model.js';
import type { CambiosGranito, FiltrosGranitos, NuevoGranito } from '../schemas/granito.schemas.js';
import { RepositorioMongoose } from './RepositorioMongoose.js';
import type { QueryFilter } from 'mongoose';
import { regexSinTildes } from '../utils/texto.js';
import type { ConId, Pagina, Paginacion, Repositorio } from './repositorio.js';

const SIN_MAYUSCULAS_NI_TILDES = { locale: 'es', strength: 1 };

export interface RepositorioGranitos extends Repositorio<Granito, NuevoGranito, CambiosGranito> {
  existeConNombre(nombre: string, excluirId?: string): Promise<boolean>;
  buscar(filtros: FiltrosGranitos, paginacion: Paginacion): Promise<Pagina<ConId<Granito>>>;
}

class RepositorioGranitosMongoose
  extends RepositorioMongoose<Granito, NuevoGranito, CambiosGranito>
  implements RepositorioGranitos
{
  async existeConNombre(nombre: string, excluirId?: string): Promise<boolean> {
    const filtro = excluirId ? { nombre, _id: { $ne: excluirId } } : { nombre };
    const encontrado = await this.modelo.exists(filtro).collation(SIN_MAYUSCULAS_NI_TILDES);
    return encontrado !== null;
  }

  async buscar(
    { busqueda, tipo, acabado, etiqueta, incluirInactivos }: FiltrosGranitos,
    paginacion: Paginacion,
  ): Promise<Pagina<ConId<Granito>>> {
    const filtro: QueryFilter<Granito> = {};
    if (!incluirInactivos) filtro.active = true;
    if (busqueda) filtro.nombre = regexSinTildes(busqueda);
    if (tipo) filtro.tipo = tipo;
    if (acabado) filtro.acabado = acabado;
    if (etiqueta) filtro.etiquetas = etiqueta;

    return this.paginar(filtro, paginacion);
  }
}

export const repositorioGranitos: RepositorioGranitos = new RepositorioGranitosMongoose(
  GranitoModelo,
);
