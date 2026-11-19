import { AppError, existeOFallar } from '../errors/AppError.js';
import { repositorioDisenos, type RepositorioDisenos } from '../repositories/diseno.repository.js';
import type { EntradaDiseno } from '../schemas/diseno.schemas.js';

const NO_EXISTE = 'No existe un diseño con ese id';

export class ServicioDisenos {
  constructor(private readonly repositorio: RepositorioDisenos) {}

  listar() {
    return this.repositorio.listar();
  }

  async obtener(id: string) {
    return existeOFallar(await this.repositorio.buscarPorId(id), NO_EXISTE);
  }

  crear(datos: EntradaDiseno) {
    return this.repositorio.crear(datos);
  }

  async reemplazar(id: string, datos: EntradaDiseno) {
    return existeOFallar(await this.repositorio.actualizar(id, datos), NO_EXISTE);
  }

  async eliminar(id: string) {
    if (!(await this.repositorio.eliminar(id))) {
      throw new AppError(404, NO_EXISTE);
    }
  }
}

export const servicioDisenos = new ServicioDisenos(repositorioDisenos);
