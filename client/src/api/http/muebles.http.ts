import type { AxiosInstance } from 'axios'
import type { Pagina } from '../../dominio/comun'
import type { EntradaMueble, FiltrosMuebles, Mueble } from '../../dominio/mueble'
import type { MueblesApi } from '../contratos'
import { limpiarParametros } from './parametros'

export class MueblesApiHttp implements MueblesApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async listar(filtros: FiltrosMuebles): Promise<Pagina<Mueble>> {
    const { data } = await this.http.get<Pagina<Mueble>>('/muebles', { params: limpiarParametros(filtros) })
    return data
  }

  async obtener(id: string): Promise<Mueble> {
    const { data } = await this.http.get<Mueble>(`/muebles/${id}`)
    return data
  }

  async crear(datos: EntradaMueble): Promise<Mueble> {
    const { data } = await this.http.post<Mueble>('/muebles', datos)
    return data
  }

  async actualizar(id: string, datos: Partial<EntradaMueble>): Promise<Mueble> {
    const { data } = await this.http.patch<Mueble>(`/muebles/${id}`, datos)
    return data
  }

  async desactivar(id: string): Promise<void> {
    await this.http.delete(`/muebles/${id}`)
  }
}
