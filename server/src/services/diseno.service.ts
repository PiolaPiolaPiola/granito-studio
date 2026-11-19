import { randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import {
  almacenamiento,
  type AlmacenamientoArchivos,
  type ArchivoImagen,
} from '../almacenamiento/index.js';
import { AppError, existeOFallar } from '../errors/AppError.js';
import { conImagenGuardada, eliminarSinFallar } from './imagenes.js';
import { ErrorValidacion, type DetalleValidacion } from '../errors/ErrorValidacion.js';
import { repositorioDisenos, type RepositorioDisenos } from '../repositories/diseno.repository.js';
import {
  repositorioGranitos,
  type RepositorioGranitos,
} from '../repositories/granito.repository.js';
import { repositorioMuebles, type RepositorioMuebles } from '../repositories/mueble.repository.js';
import type { EntradaDiseno } from '../schemas/diseno.schemas.js';

const NO_EXISTE = 'No existe un diseño con ese id';
const SUFIJO_COPIA = ' (copia)';
const LARGO_MAXIMO_NOMBRE = 80;

function nombreDeCopia(nombre: string): string {
  return nombre.slice(0, LARGO_MAXIMO_NOMBRE - SUFIJO_COPIA.length) + SUFIJO_COPIA;
}

export class ServicioDisenos {
  constructor(
    private readonly repositorio: RepositorioDisenos,
    private readonly muebles: RepositorioMuebles,
    private readonly granitos: RepositorioGranitos,
    private readonly almacenamiento: AlmacenamientoArchivos,
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

  /**
   * Copia un diseño. Cada mueble recibe un `_id` nuevo y los materiales que lo
   * referencian (`muebleEnDiseno`) se reapuntan a ese id nuevo.
   */
  async duplicar(id: string) {
    const original = await this.obtener(id);

    const idsNuevos = new Map<string, string>();
    const muebles = original.muebles.map(({ _id, mueble, posicion, medidasCm, ubicacion }) => {
      const nuevoId = new Types.ObjectId().toString();
      idsNuevos.set(_id.toString(), nuevoId);
      return {
        _id: nuevoId,
        mueble: mueble.toString(),
        posicion,
        ...(medidasCm && { medidasCm: { ...medidasCm } }),
        ...(ubicacion && { ubicacion: { ...ubicacion } }),
      };
    });

    const materiales = original.materiales.map(({ pieza, muebleEnDiseno, granito, colorHex }) => ({
      pieza,
      ...(muebleEnDiseno && { muebleEnDiseno: idsNuevos.get(muebleEnDiseno.toString()) }),
      ...(granito && { granito: granito.toString() }),
      ...(colorHex && { colorHex }),
    }));

    return this.repositorio.crear({
      nombre: nombreDeCopia(original.nombre),
      espacio: original.espacio,
      forma: original.forma,
      medidasM: { ancho: original.medidasM.ancho, fondo: original.medidasM.fondo },
      acabados: { ...original.acabados },
      ...(original.entorno && { entorno: { ...original.entorno } }),
      objetos: (original.objetos ?? []).map(({ tipo, ubicacion }) => ({
        tipo,
        ubicacion: { ...ubicacion },
      })),
      muebles,
      materiales,
    });
  }

  /**
   * Crea (o devuelve, si ya existe) el código del enlace público. Es aleatorio y largo
   * (128 bits): no se puede adivinar ni recorrer como un id de Mongo.
   */
  async compartir(id: string) {
    const diseno = await this.obtener(id);
    if (diseno.codigoPublico) return diseno.codigoPublico;
    const codigo = randomBytes(16).toString('base64url');
    existeOFallar(await this.repositorio.cambiarCodigo(id, codigo), NO_EXISTE);
    return codigo;
  }

  /**
   * El enlace anterior deja de funcionar (si se vuelve a compartir, el código es otro) y el
   * diseño sale de la página de inicio: lo destacado tiene que poder abrirse.
   */
  async dejarDeCompartir(id: string) {
    existeOFallar(await this.repositorio.cambiarCodigo(id, null), NO_EXISTE);
    await this.repositorio.cambiarDestacado(id, false);
  }

  /** Mostrar (o no) el diseño en la página de inicio. Destacar también lo comparte. */
  async destacar(id: string, destacado: boolean) {
    const codigoPublico = destacado ? await this.compartir(id) : undefined;
    existeOFallar(await this.repositorio.cambiarDestacado(id, destacado), NO_EXISTE);
    return { destacado, codigoPublico };
  }

  /** Para la página de inicio: lo mínimo de cada diseño destacado. */
  async listarDestacados() {
    const disenos = await this.repositorio.listarDestacados(6);
    return disenos.map(({ nombre, espacio, forma, medidasM, muebles, codigoPublico }) => ({
      nombre,
      espacio,
      forma,
      medidasM,
      cantidadMuebles: muebles.length,
      codigoPublico,
    }));
  }

  /**
   * Lo que ve un cliente sin sesión: el diseño y solo los muebles y piedras que usa, con
   * los campos necesarios para dibujarlo (sin precios ni datos internos).
   */
  async obtenerPublico(codigo: string) {
    const diseno = await this.repositorio.buscarPorCodigo(codigo);
    if (!diseno) throw new AppError(404, 'Este enlace no existe o ya no está compartido');

    const [muebles, granitos] = await Promise.all([
      this.muebles.buscarPorIds(diseno.muebles.map(({ mueble }) => mueble.toString())),
      this.granitos.buscarPorIds(
        diseno.materiales.flatMap(({ granito }) => (granito ? [granito.toString()] : [])),
      ),
    ]);

    const publico = { ...diseno };
    delete publico.codigoPublico;
    delete publico.fondoUrl; // la foto de la casa del cliente es privada
    return {
      diseno: publico,
      muebles: muebles.map(
        ({
          _id,
          nombre,
          espacio,
          tipo,
          material,
          colorHex,
          anchoCm,
          altoCm,
          fondoCm,
          imagenUrl,
        }) => ({
          _id,
          nombre,
          espacio,
          tipo,
          material,
          colorHex,
          anchoCm,
          altoCm,
          fondoCm,
          imagenUrl,
        }),
      ),
      granitos: granitos.map(({ _id, nombre, tipo, acabado, imagenUrl, fotoUrl, etiquetas }) => ({
        _id,
        nombre,
        tipo,
        acabado,
        imagenUrl,
        fotoUrl,
        etiquetas,
      })),
    };
  }

  /** Foto del espacio real (la de antes se borra). */
  async cambiarFondo(id: string, imagen: ArchivoImagen | null) {
    const anterior = await this.obtener(id);
    let diseno;
    if (imagen) {
      diseno = await conImagenGuardada(this.almacenamiento, imagen, 'fondos', async (url) =>
        existeOFallar(await this.repositorio.cambiarFondo(id, url), NO_EXISTE),
      );
    } else {
      diseno = existeOFallar(await this.repositorio.cambiarFondo(id, null), NO_EXISTE);
    }
    await eliminarSinFallar(this.almacenamiento, anterior.fondoUrl);
    return diseno;
  }

  async eliminar(id: string) {
    const anterior = await this.repositorio.buscarPorId(id);
    await eliminarSinFallar(this.almacenamiento, anterior?.fondoUrl);
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
  almacenamiento,
);
