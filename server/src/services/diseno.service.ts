import { AppError, existeOFallar } from '../errors/AppError.js';
import { ErrorValidacion, type DetalleValidacion } from '../errors/ErrorValidacion.js';
import { repositorioDisenos, type RepositorioDisenos } from '../repositories/diseno.repository.js';
import {
  repositorioGranitos,
  type RepositorioGranitos,
} from '../repositories/granito.repository.js';
import { repositorioMuebles, type RepositorioMuebles } from '../repositories/mueble.repository.js';
import type { EntradaDiseno } from '../schemas/diseno.schemas.js';

const NO_EXISTE = 'No existe un diseño con ese id';

export class ServicioDisenos {
  constructor(
    private readonly repositorio: RepositorioDisenos,
    private readonly muebles: RepositorioMuebles,
    private readonly granitos: RepositorioGranitos,
  ) {}

  listar() {
    return this.repositorio.listar();
  }

  async obtener(id: string) {
    return existeOFallar(await this.repositorio.buscarPorId(id), NO_EXISTE);
  }

  async crear(datos: EntradaDiseno) {
    await this.validarReferencias(datos);
    return this.repositorio.crear(datos);
  }

  async reemplazar(id: string, datos: EntradaDiseno) {
    await this.obtener(id);
    await this.validarReferencias(datos);
    return existeOFallar(await this.repositorio.actualizar(id, datos), NO_EXISTE);
  }

  async eliminar(id: string) {
    if (!(await this.repositorio.eliminar(id))) {
      throw new AppError(404, NO_EXISTE);
    }
  }

  /**
   * zod ya revisó el formato de los ids; aquí se comprueba que existan en la base.
   * Se aceptan muebles y granitos inactivos: un diseño viejo debe poder guardarse de nuevo.
   * Los errores usan las mismas rutas que zod (`body.muebles.0.mueble`) para que el
   * formulario del editor los muestre junto al campo.
   */
  private async validarReferencias({ muebles, materiales }: EntradaDiseno) {
    const [mueblesExistentes, granitosExistentes] = await Promise.all([
      this.muebles.idsExistentes(muebles.map(({ mueble }) => mueble)),
      this.granitos.idsExistentes(materiales.flatMap(({ granito }) => granito ?? [])),
    ]);

    const detalles: DetalleValidacion[] = [];
    muebles.forEach(({ mueble }, indice) => {
      if (!mueblesExistentes.has(mueble.toLowerCase())) {
        detalles.push({
          campo: `body.muebles.${String(indice)}.mueble`,
          mensaje: 'No existe un mueble con ese id',
        });
      }
    });
    materiales.forEach(({ granito }, indice) => {
      if (granito !== undefined && !granitosExistentes.has(granito.toLowerCase())) {
        detalles.push({
          campo: `body.materiales.${String(indice)}.granito`,
          mensaje: 'No existe un granito con ese id',
        });
      }
    });

    if (detalles.length > 0) {
      throw new ErrorValidacion(detalles);
    }
  }
}

export const servicioDisenos = new ServicioDisenos(
  repositorioDisenos,
  repositorioMuebles,
  repositorioGranitos,
);
