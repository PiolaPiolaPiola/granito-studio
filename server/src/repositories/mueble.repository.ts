import type { QueryFilter } from 'mongoose';
import { MuebleModelo, type Mueble } from '../models/mueble.model.js';
import type { ActualizarMueble, CrearMueble, FiltrosMuebles } from '../schemas/mueble.schemas.js';
import { regexSinTildes } from '../utils/texto.js';
import type { ConId, Pagina, Paginacion, Repositorio } from './repositorio.js';
import { RepositorioMongoose } from './RepositorioMongoose.js';

export interface RepositorioMuebles extends Repositorio<Mueble, CrearMueble, ActualizarMueble> {
  buscar(filtros: FiltrosMuebles, paginacion: Paginacion): Promise<Pagina<ConId<Mueble>>>;
}

class RepositorioMueblesMongoose
  extends RepositorioMongoose<Mueble, CrearMueble, ActualizarMueble>
  implements RepositorioMuebles
{
  buscar(
    { busqueda, tipo, incluirInactivos }: FiltrosMuebles,
    paginacion: Paginacion,
  ): Promise<Pagina<ConId<Mueble>>> {
    const filtro: QueryFilter<Mueble> = {};
    if (!incluirInactivos) filtro.active = true;
    if (busqueda) filtro.nombre = regexSinTildes(busqueda);
    if (tipo) filtro.tipo = tipo;

    return this.paginar(filtro, paginacion);
  }
}

export const repositorioMuebles: RepositorioMuebles = new RepositorioMueblesMongoose(MuebleModelo);
