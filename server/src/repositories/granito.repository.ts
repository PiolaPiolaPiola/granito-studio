import { GranitoModelo, type Granito } from '../models/granito.model.js';
import type { ActualizarGranito, CrearGranito } from '../schemas/granito.schemas.js';
import type { Repositorio } from './repositorio.js';
import { RepositorioMongoose } from './RepositorioMongoose.js';

const SIN_MAYUSCULAS_NI_TILDES = { locale: 'es', strength: 1 };

export interface RepositorioGranitos extends Repositorio<Granito, CrearGranito, ActualizarGranito> {
  existeConNombre(nombre: string, excluirId?: string): Promise<boolean>;
}

class RepositorioGranitosMongoose
  extends RepositorioMongoose<Granito, CrearGranito, ActualizarGranito>
  implements RepositorioGranitos
{
  async existeConNombre(nombre: string, excluirId?: string): Promise<boolean> {
    const filtro = excluirId ? { nombre, _id: { $ne: excluirId } } : { nombre };
    const encontrado = await this.modelo.exists(filtro).collation(SIN_MAYUSCULAS_NI_TILDES);
    return encontrado !== null;
  }
}

export const repositorioGranitos: RepositorioGranitos = new RepositorioGranitosMongoose(
  GranitoModelo,
);
