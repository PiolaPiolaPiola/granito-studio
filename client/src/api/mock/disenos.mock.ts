import { aEntrada, clonarContenido, type Diseno, type EntradaDiseno } from '../../dominio/diseno'
import { generarObjectId } from '../../infra/generarId'
import type { DisenosApi } from '../contratos'
import { ahora, Coleccion, demora } from './coleccion'
import { crearDisenosSemilla } from './semillas'

export class DisenosApiMock implements DisenosApi {
  private readonly datos = new Coleccion<Diseno>('disenos', crearDisenosSemilla)

  async listar(): Promise<Diseno[]> {
    await demora()
    return [...this.datos.todos()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async obtener(id: string): Promise<Diseno> {
    await demora()
    return this.datos.buscarPorId(id)
  }

  async crear(datos: EntradaDiseno): Promise<Diseno> {
    await demora()
    return this.datos.agregar({ ...datos, _id: generarObjectId(), creationAt: ahora(), updatedAt: ahora() })
  }

  async reemplazar(id: string, datos: EntradaDiseno): Promise<Diseno> {
    await demora()
    const actual = this.datos.buscarPorId(id)
    return this.datos.reemplazar(id, { ...datos, _id: id, creationAt: actual.creationAt, updatedAt: ahora() })
  }

  async eliminar(id: string): Promise<void> {
    await demora()
    this.datos.quitar(id)
  }

  async duplicar(id: string): Promise<Diseno> {
    await demora()
    const origen = this.datos.buscarPorId(id)
    const copia = clonarContenido(aEntrada(origen))
    return this.datos.agregar({
      ...copia,
      nombre: `${origen.nombre} (copia)`.slice(0, 80),
      _id: generarObjectId(),
      creationAt: ahora(),
      updatedAt: ahora(),
    })
  }
}
