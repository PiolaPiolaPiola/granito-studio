import { existeOFallar } from '../errors/AppError.js';
import { repositorioMuebles, type RepositorioMuebles } from '../repositories/mueble.repository.js';
import type { ActualizarMueble, CrearMueble, ListarMuebles } from '../schemas/mueble.schemas.js';
import { metadatosPagina } from '../utils/paginacion.js';

const NO_EXISTE = 'No existe un mueble con ese id';

export class ServicioMuebles {
  constructor(private readonly repositorio: RepositorioMuebles) {}

  async listar({ pagina, porPagina, ...filtros }: ListarMuebles, esAdmin: boolean) {
    const { elementos, total } = await this.repositorio.buscar(
      { ...filtros, incluirInactivos: filtros.incluirInactivos && esAdmin },
      { pagina, porPagina },
    );
    return { muebles: elementos, ...metadatosPagina(total, { pagina, porPagina }) };
  }

  async obtener(id: string) {
    return existeOFallar(await this.repositorio.buscarPorId(id), NO_EXISTE);
  }

  crear(datos: CrearMueble) {
    return this.repositorio.crear(datos);
  }

  async actualizar(id: string, cambios: ActualizarMueble) {
    return existeOFallar(await this.repositorio.actualizar(id, cambios), NO_EXISTE);
  }

  async inactivar(id: string) {
    existeOFallar(await this.repositorio.inactivar(id), NO_EXISTE);
  }
}

export const servicioMuebles = new ServicioMuebles(repositorioMuebles);
