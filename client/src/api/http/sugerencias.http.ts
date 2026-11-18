import type { AxiosInstance } from 'axios'
import type { ContextoSugerencia, Sugerencia } from '../../dominio/sugerencia'
import type { SugerenciasApi } from '../contratos'
import { limpiarParametros } from './parametros'

export class SugerenciasApiHttp implements SugerenciasApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async sugerir(contexto: ContextoSugerencia): Promise<Sugerencia[]> {
    const { data } = await this.http.get<Sugerencia[]>('/sugerencias', { params: limpiarParametros(contexto) })
    return data
  }
}
