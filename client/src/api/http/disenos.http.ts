import type { AxiosInstance } from 'axios'
import type { Diseno, EntradaDiseno } from '../../dominio/diseno'
import type { DisenosApi } from '../contratos'

export class DisenosApiHttp implements DisenosApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async listar(): Promise<Diseno[]> {
    const { data } = await this.http.get<{ disenos: Diseno[] }>('/disenos')
    return data.disenos
  }

  async obtener(id: string): Promise<Diseno> {
    const { data } = await this.http.get<{ diseno: Diseno }>(`/disenos/${id}`)
    return data.diseno
  }

  async crear(datos: EntradaDiseno): Promise<Diseno> {
    const { data } = await this.http.post<{ diseno: Diseno }>('/disenos', datos)
    return data.diseno
  }

  async reemplazar(id: string, datos: EntradaDiseno): Promise<Diseno> {
    const { data } = await this.http.put<{ diseno: Diseno }>(`/disenos/${id}`, datos)
    return data.diseno
  }

  async eliminar(id: string): Promise<void> {
    await this.http.delete(`/disenos/${id}`)
  }

  async duplicar(id: string): Promise<Diseno> {
    const { data } = await this.http.post<{ diseno: Diseno }>(`/disenos/${id}/duplicar`)
    return data.diseno
  }
}
