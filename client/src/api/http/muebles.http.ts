import type { AxiosInstance } from 'axios'
import type { Pagina } from '../../dominio/comun'
import type { EntradaMueble, FiltrosMuebles, Mueble } from '../../dominio/mueble'
import type { MueblesApi } from '../contratos'
import { aPagina, parametrosPaginados, type MetadatosPagina } from './parametros'

export class MueblesApiHttp implements MueblesApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async listar(filtros: FiltrosMuebles): Promise<Pagina<Mueble>> {
    const { data } = await this.http.get<{ muebles: Mueble[] } & MetadatosPagina>('/muebles', {
      params: parametrosPaginados(filtros),
    })
    return aPagina(data.muebles, data)
  }

  async obtener(id: string): Promise<Mueble> {
    const { data } = await this.http.get<{ mueble: Mueble }>(`/muebles/${id}`)
    return data.mueble
  }

  async crear(datos: EntradaMueble): Promise<Mueble> {
    const { data } = await this.http.post<{ mueble: Mueble }>('/muebles', datos)
    return data.mueble
  }

  async actualizar(id: string, datos: Partial<EntradaMueble>): Promise<Mueble> {
    const { data } = await this.http.patch<{ mueble: Mueble }>(`/muebles/${id}`, datos)
    return data.mueble
  }

  async desactivar(id: string): Promise<void> {
    await this.http.delete(`/muebles/${id}`)
  }
}
