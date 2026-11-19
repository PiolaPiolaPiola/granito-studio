import { AppError } from '../errors/AppError.js';
import {
  repositorioGranitos,
  type RepositorioGranitos,
} from '../repositories/granito.repository.js';
import type {
  ActualizarGranito,
  CrearGranito,
  ListarGranitos,
} from '../schemas/granito.schemas.js';

export class ServicioGranitos {
  constructor(private readonly repositorio: RepositorioGranitos) {}

  async listar({ pagina, porPagina, ...filtros }: ListarGranitos) {
    const { elementos, total } = await this.repositorio.buscar(filtros, { pagina, porPagina });
    return {
      granitos: elementos,
      pagina,
      porPagina,
      total,
      totalPaginas: Math.ceil(total / porPagina),
    };
  }

  async obtener(id: string) {
    const granito = await this.repositorio.buscarPorId(id);

    if (!granito) {
      throw new AppError(404, 'No existe un granito con ese id');
    }
    return granito;
  }

  async crear(datos: CrearGranito) {
    await this.validarNombreLibre(datos.nombre);
    return this.repositorio.crear(datos);
  }

  async actualizar(id: string, cambios: ActualizarGranito) {
    if (cambios.nombre !== undefined) {
      await this.validarNombreLibre(cambios.nombre, id);
    }

    const granito = await this.repositorio.actualizar(id, cambios);
    if (!granito) {
      throw new AppError(404, 'No existe un granito con ese id');
    }
    return granito;
  }

  private async validarNombreLibre(nombre: string, excluirId?: string) {
    if (await this.repositorio.existeConNombre(nombre, excluirId)) {
      throw new AppError(409, `Ya existe un granito llamado "${nombre}"`);
    }
  }
}

export const servicioGranitos = new ServicioGranitos(repositorioGranitos);
