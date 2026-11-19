import { isValidObjectId, type QueryFilter, type UpdateQuery } from 'mongoose';
import { MuebleModelo, type Mueble } from '../models/mueble.model.js';
import type { CambiosMueble, FiltrosMuebles, NuevoMueble } from '../schemas/mueble.schemas.js';
import { regexSinTildes } from '../utils/texto.js';
import type { ConId, Pagina, Paginacion, Repositorio } from './repositorio.js';
import { RepositorioMongoose } from './RepositorioMongoose.js';

export interface RepositorioMuebles extends Repositorio<Mueble, NuevoMueble, CambiosMueble> {
  buscar(filtros: FiltrosMuebles, paginacion: Paginacion): Promise<Pagina<ConId<Mueble>>>;
}

class RepositorioMueblesMongoose
  extends RepositorioMongoose<Mueble, NuevoMueble, CambiosMueble>
  implements RepositorioMuebles
{
  buscar(
    { busqueda, espacio, tipo, material, incluirInactivos }: FiltrosMuebles,
    paginacion: Paginacion,
  ): Promise<Pagina<ConId<Mueble>>> {
    const filtro: QueryFilter<Mueble> = {};
    if (!incluirInactivos) filtro.active = true;
    if (busqueda) filtro.nombre = regexSinTildes(busqueda);
    if (espacio) filtro.espacio = espacio;
    if (tipo) filtro.tipo = tipo;
    if (material) filtro.material = material;

    return this.paginar(filtro, paginacion);
  }

  /** `imagenUrl: null` significa "quitar la foto": se traduce a `$unset`. */
  override async actualizar(id: string, cambios: CambiosMueble): Promise<ConId<Mueble> | null> {
    const { imagenUrl, ...resto } = cambios;
    if (imagenUrl !== null) {
      return super.actualizar(id, cambios);
    }
    if (!isValidObjectId(id)) return null;
    const actualizacion: UpdateQuery<Mueble> = { $set: resto, $unset: { imagenUrl: 1 } };
    return this.modelo
      .findByIdAndUpdate(id, actualizacion, { returnDocument: 'after', runValidators: true })
      .lean<ConId<Mueble>>()
      .exec();
  }
}

export const repositorioMuebles: RepositorioMuebles = new RepositorioMueblesMongoose(MuebleModelo);
