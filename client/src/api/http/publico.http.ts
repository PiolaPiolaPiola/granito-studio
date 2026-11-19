import type { AxiosInstance } from 'axios'
import type { Granito } from '../../dominio/granito'
import type { DisenoDestacado, PublicoApi } from '../contratos'

/** Lo que se ve sin iniciar sesión (página de inicio). */
export class PublicoApiHttp implements PublicoApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async destacados(): Promise<DisenoDestacado[]> {
    const { data } = await this.http.get<{ disenos: DisenoDestacado[] }>('/publico/destacados')
    return data.disenos
  }

  async piedras(): Promise<Granito[]> {
    const { data } = await this.http.get<{ piedras: Omit<Granito, 'active' | 'creationAt' | 'updatedAt'>[] }>('/publico/piedras')
    return data.piedras.map((p) => ({ active: true, creationAt: '', updatedAt: '', ...p }))
  }
}
