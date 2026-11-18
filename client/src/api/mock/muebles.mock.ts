import { normalizarTexto, type Pagina } from '../../dominio/comun'
import type { EntradaMueble, FiltrosMuebles, Mueble } from '../../dominio/mueble'
import { generarObjectId } from '../../infra/generarId'
import type { MueblesApi } from '../contratos'
import { ahora, Coleccion, demora, paginar } from './coleccion'
import { crearMueblesSemilla } from './semillas'

export class MueblesApiMock implements MueblesApi {
  private readonly datos = new Coleccion<Mueble>('muebles', crearMueblesSemilla)

  async listar(filtros: FiltrosMuebles): Promise<Pagina<Mueble>> {
    await demora()
    const busqueda = normalizarTexto(filtros.busqueda ?? '')
    const coincidentes = this.datos
      .todos()
      .filter(
        (m) =>
          m.active &&
          (filtros.tipo === undefined || m.tipo === filtros.tipo) &&
          (busqueda === '' || normalizarTexto(m.nombre).includes(busqueda)),
      )
    return paginar(coincidentes, filtros.pagina, filtros.limite)
  }

  async obtener(id: string): Promise<Mueble> {
    await demora()
    return this.datos.buscarPorId(id)
  }

  async crear(datos: EntradaMueble): Promise<Mueble> {
    await demora()
    return this.datos.agregar({ ...datos, _id: generarObjectId(), active: true, creationAt: ahora(), updatedAt: ahora() })
  }

  async actualizar(id: string, datos: Partial<EntradaMueble>): Promise<Mueble> {
    await demora()
    const actual = this.datos.buscarPorId(id)
    return this.datos.reemplazar(id, { ...actual, ...datos, updatedAt: ahora() })
  }

  async desactivar(id: string): Promise<void> {
    await demora()
    const actual = this.datos.buscarPorId(id)
    this.datos.reemplazar(id, { ...actual, active: false, updatedAt: ahora() })
  }
}
