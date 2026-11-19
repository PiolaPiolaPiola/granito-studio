import { isValidObjectId } from 'mongoose';
import { DisenoModelo, type Diseno } from '../models/diseno.model.js';
import type { EntradaDiseno } from '../schemas/diseno.schemas.js';
import type { ConId, Repositorio } from './repositorio.js';
import { RepositorioMongoose } from './RepositorioMongoose.js';

/**
 * Un diseño se reemplaza completo (PUT), así que crear y actualizar reciben lo mismo.
 * A diferencia de granitos y muebles, un diseño sí se borra de verdad: nada lo referencia.
 */
export interface RepositorioDisenos extends Repositorio<Diseno, EntradaDiseno, EntradaDiseno> {
  eliminar(id: string): Promise<boolean>;
  buscarPorCodigo(codigo: string): Promise<ConId<Diseno> | null>;
  /** Pone o quita (`null`) el código del enlace público. */
  cambiarCodigo(id: string, codigo: string | null): Promise<ConId<Diseno> | null>;
}

class RepositorioDisenosMongoose
  extends RepositorioMongoose<Diseno, EntradaDiseno, EntradaDiseno>
  implements RepositorioDisenos
{
  /** Los diseños editados hace poco van primero. */
  override listar(): Promise<ConId<Diseno>[]> {
    return this.modelo.find().sort({ updatedAt: -1, _id: -1 }).lean<ConId<Diseno>[]>().exec();
  }

  buscarPorCodigo(codigo: string): Promise<ConId<Diseno> | null> {
    return this.modelo.findOne({ codigoPublico: codigo }).lean<ConId<Diseno>>().exec();
  }

  async cambiarCodigo(id: string, codigo: string | null): Promise<ConId<Diseno> | null> {
    if (!isValidObjectId(id)) return null;
    const cambios =
      codigo === null ? { $unset: { codigoPublico: 1 } } : { $set: { codigoPublico: codigo } };
    // `timestamps: false`: compartir no cuenta como editar el diseño.
    return this.modelo
      .findByIdAndUpdate(id, cambios, { returnDocument: 'after', timestamps: false })
      .lean<ConId<Diseno>>()
      .exec();
  }

  async eliminar(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    const eliminado = await this.modelo.findByIdAndDelete(id).exec();
    return eliminado !== null;
  }
}

export const repositorioDisenos: RepositorioDisenos = new RepositorioDisenosMongoose(DisenoModelo);
