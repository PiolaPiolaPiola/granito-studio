import {
  almacenamiento,
  type AlmacenamientoArchivos,
  type ArchivoImagen,
} from '../almacenamiento/index.js';
import { AppError, existeOFallar } from '../errors/AppError.js';
import {
  repositorioGranitos,
  type RepositorioGranitos,
} from '../repositories/granito.repository.js';
import { MENSAJE_SIN_CAMPOS } from '../schemas/comunes.js';
import { metadatosPagina } from '../utils/paginacion.js';
import type {
  ActualizarGranito,
  CambiosGranito,
  CrearGranito,
  ListarGranitos,
} from '../schemas/granito.schemas.js';

const CARPETA_IMAGENES = 'granitos';
const NO_EXISTE = 'No existe un granito con ese id';

export class ServicioGranitos {
  constructor(
    private readonly repositorio: RepositorioGranitos,
    private readonly almacenamiento: AlmacenamientoArchivos,
  ) {}

  async listar({ pagina, porPagina, ...filtros }: ListarGranitos, esAdmin: boolean) {
    const { elementos, total } = await this.repositorio.buscar(
      { ...filtros, incluirInactivos: filtros.incluirInactivos && esAdmin },
      { pagina, porPagina },
    );
    return { granitos: elementos, ...metadatosPagina(total, { pagina, porPagina }) };
  }

  async obtener(id: string) {
    return existeOFallar(await this.repositorio.buscarPorId(id), NO_EXISTE);
  }

  async crear(datos: CrearGranito, imagen: ArchivoImagen) {
    await this.validarNombreLibre(datos.nombre);

    const imagenUrl = await this.almacenamiento.guardar(imagen, CARPETA_IMAGENES);
    try {
      return await this.repositorio.crear({ ...datos, imagenUrl });
    } catch (error) {
      // Si la base rechaza el granito, la imagen quedaría huérfana: se borra (compensación).
      await this.almacenamiento.eliminar(imagenUrl);
      throw error;
    }
  }

  async actualizar(id: string, cambios: ActualizarGranito, imagen?: ArchivoImagen) {
    if (Object.keys(cambios).length === 0 && !imagen) {
      throw new AppError(400, MENSAJE_SIN_CAMPOS);
    }

    const anterior = await this.obtener(id);
    if (cambios.nombre !== undefined) {
      await this.validarNombreLibre(cambios.nombre, id);
    }

    if (!imagen) {
      return this.actualizarOFallar(id, cambios);
    }

    const imagenUrl = await this.almacenamiento.guardar(imagen, CARPETA_IMAGENES);
    let granito;
    try {
      granito = await this.actualizarOFallar(id, { ...cambios, imagenUrl });
    } catch (error) {
      await this.almacenamiento.eliminar(imagenUrl);
      throw error;
    }

    await this.eliminarSinFallar(anterior.imagenUrl);
    return granito;
  }

  async inactivar(id: string) {
    existeOFallar(await this.repositorio.inactivar(id), NO_EXISTE);
  }

  private async actualizarOFallar(id: string, cambios: CambiosGranito) {
    return existeOFallar(await this.repositorio.actualizar(id, cambios), NO_EXISTE);
  }

  /** La imagen vieja ya no se usa: si no se puede borrar, se registra y la petición sigue. */
  private async eliminarSinFallar(url: string) {
    try {
      await this.almacenamiento.eliminar(url);
    } catch (error) {
      console.error(`No se pudo borrar la imagen anterior ${url}:`, error);
    }
  }

  private async validarNombreLibre(nombre: string, excluirId?: string) {
    if (await this.repositorio.existeConNombre(nombre, excluirId)) {
      throw new AppError(409, `Ya existe un granito llamado "${nombre}"`);
    }
  }
}

export const servicioGranitos = new ServicioGranitos(repositorioGranitos, almacenamiento);
