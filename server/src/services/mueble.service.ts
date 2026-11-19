import {
  almacenamiento,
  type AlmacenamientoArchivos,
  type ArchivoImagen,
} from '../almacenamiento/index.js';
import { AppError, existeOFallar } from '../errors/AppError.js';
import { ErrorValidacion } from '../errors/ErrorValidacion.js';
import { tipoPermitido } from '../models/mueble.model.js';
import { repositorioMuebles, type RepositorioMuebles } from '../repositories/mueble.repository.js';
import { MENSAJE_SIN_CAMPOS } from '../schemas/comunes.js';
import {
  MENSAJE_TIPO_ESPACIO,
  type ActualizarMueble,
  type CambiosMueble,
  type CrearMueble,
  type ListarMuebles,
} from '../schemas/mueble.schemas.js';
import { metadatosPagina } from '../utils/paginacion.js';
import { conImagenGuardada, eliminarSinFallar } from './imagenes.js';

const CARPETA_IMAGENES = 'muebles';
const NO_EXISTE = 'No existe un mueble con ese id';

export class ServicioMuebles {
  constructor(
    private readonly repositorio: RepositorioMuebles,
    private readonly almacenamiento: AlmacenamientoArchivos,
  ) {}

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

  /** La foto es opcional: un mueble sin foto se dibuja con su material y su color. */
  crear(datos: CrearMueble, imagen?: ArchivoImagen) {
    if (!imagen) return this.repositorio.crear(datos);
    return conImagenGuardada(this.almacenamiento, imagen, CARPETA_IMAGENES, (imagenUrl) =>
      this.repositorio.crear({ ...datos, imagenUrl }),
    );
  }

  async actualizar(
    id: string,
    { quitarImagen, ...cambios }: ActualizarMueble,
    imagen?: ArchivoImagen,
  ) {
    if (Object.keys(cambios).length === 0 && !imagen && !quitarImagen) {
      throw new AppError(400, MENSAJE_SIN_CAMPOS);
    }

    const anterior = await this.obtener(id);
    // Cambiar solo el espacio (o solo el tipo) puede dejar una combinación inválida.
    const espacio = cambios.espacio ?? anterior.espacio;
    const tipo = cambios.tipo ?? anterior.tipo;
    if (!tipoPermitido(espacio, tipo)) {
      throw new ErrorValidacion([{ campo: 'body.tipo', mensaje: MENSAJE_TIPO_ESPACIO }]);
    }

    const mueble = imagen
      ? await conImagenGuardada(this.almacenamiento, imagen, CARPETA_IMAGENES, (imagenUrl) =>
          this.actualizarOFallar(id, { ...cambios, imagenUrl }),
        )
      : await this.actualizarOFallar(id, quitarImagen ? { ...cambios, imagenUrl: null } : cambios);

    if (imagen || quitarImagen) {
      await eliminarSinFallar(this.almacenamiento, anterior.imagenUrl);
    }
    return mueble;
  }

  async inactivar(id: string) {
    existeOFallar(await this.repositorio.inactivar(id), NO_EXISTE);
  }

  private async actualizarOFallar(id: string, cambios: CambiosMueble) {
    return existeOFallar(await this.repositorio.actualizar(id, cambios), NO_EXISTE);
  }
}

export const servicioMuebles = new ServicioMuebles(repositorioMuebles, almacenamiento);
