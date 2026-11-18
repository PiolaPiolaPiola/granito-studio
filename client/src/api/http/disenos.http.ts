import type { AxiosInstance } from 'axios'
import type { Diseno, EntradaDiseno } from '../../dominio/diseno'
import type { DisenosApi } from '../contratos'

export class DisenosApiHttp implements DisenosApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async listar(): Promise<Diseno[]> {
    const { data } = await this.http.get<Diseno[]>('/disenos')
    return data
  }

  async obtener(id: string): Promise<Diseno> {
    const { data } = await this.http.get<Diseno>(`/disenos/${id}`)
    return data
  }

  async crear(datos: EntradaDiseno): Promise<Diseno> {
    const { data } = await this.http.post<Diseno>('/disenos', datos)
    return data
  }

  async reemplazar(id: string, datos: EntradaDiseno): Promise<Diseno> {
    const { data } = await this.http.put<Diseno>(`/disenos/${id}`, datos)
    return data
  }

  async eliminar(id: string): Promise<void> {
    await this.http.delete(`/disenos/${id}`)
  }

  async duplicar(id: string): Promise<Diseno> {
    const { data } = await this.http.post<Diseno>(`/disenos/${id}/duplicar`)
    return data
  }
}
