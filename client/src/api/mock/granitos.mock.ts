import { normalizarTexto, type Pagina } from '../../dominio/comun'
import type { EntradaGranito, FiltrosGranitos, Granito } from '../../dominio/granito'
import { generarObjectId } from '../../infra/generarId'
import type { GranitosApi } from '../contratos'
import { ahora, Coleccion, demora, leerComoDataUrl, paginar } from './coleccion'
import { crearGranitosSemilla } from './semillas'

export class GranitosApiMock implements GranitosApi {
  private readonly datos = new Coleccion<Granito>('granitos', crearGranitosSemilla)

  async listar(filtros: FiltrosGranitos): Promise<Pagina<Granito>> {
    await demora()
    const busqueda = normalizarTexto(filtros.busqueda ?? '')
    const etiqueta = normalizarTexto(filtros.etiqueta ?? '')
    const coincidentes = this.datos.todos().filter(
      (g) =>
        g.active &&
        (filtros.tipo === undefined || g.tipo === filtros.tipo) &&
        (filtros.acabado === undefined || g.acabado === filtros.acabado) &&
        (etiqueta === '' || g.etiquetas.some((e) => normalizarTexto(e) === etiqueta)) &&
        (busqueda === '' ||
          normalizarTexto(g.nombre).includes(busqueda) ||
          g.etiquetas.some((e) => normalizarTexto(e).includes(busqueda))),
    )
    return paginar(coincidentes, filtros.pagina, filtros.limite)
  }

  async obtener(id: string): Promise<Granito> {
    await demora()
    return this.datos.buscarPorId(id)
  }

  async crear(datos: EntradaGranito, imagen: File): Promise<Granito> {
    await demora()
    const granito: Granito = {
      ...datos,
      _id: generarObjectId(),
      imagenUrl: await leerComoDataUrl(imagen),
      active: true,
      creationAt: ahora(),
      updatedAt: ahora(),
    }
    return this.datos.agregar(granito)
  }

  async actualizar(id: string, datos: Partial<EntradaGranito>, imagen?: File): Promise<Granito> {
    await demora()
    const actual = this.datos.buscarPorId(id)
    const imagenUrl = imagen === undefined ? actual.imagenUrl : await leerComoDataUrl(imagen)
    return this.datos.reemplazar(id, { ...actual, ...datos, imagenUrl, updatedAt: ahora() })
  }

  async desactivar(id: string): Promise<void> {
    await demora()
    const actual = this.datos.buscarPorId(id)
    this.datos.reemplazar(id, { ...actual, active: false, updatedAt: ahora() })
  }
}
