import type { AxiosInstance } from 'axios'
import type { Diseno, EntradaDiseno } from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import type { Mueble } from '../../dominio/mueble'
import type { DisenoPublico, DisenosApi } from '../contratos'

/** La respuesta pública trae menos campos: se completan los que la escena no usa. */
const completar = <T extends object>(x: T) => ({ active: true, creationAt: '', updatedAt: '', ...x })

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

  async compartir(id: string): Promise<string> {
    const { data } = await this.http.post<{ codigoPublico: string }>(`/disenos/${id}/compartir`)
    return data.codigoPublico
  }

  async dejarDeCompartir(id: string): Promise<void> {
    await this.http.delete(`/disenos/${id}/compartir`)
  }

  async verPublico(codigo: string): Promise<DisenoPublico> {
    const { data } = await this.http.get<DisenoPublico>(`/publico/disenos/${encodeURIComponent(codigo)}`)
    return {
      diseno: data.diseno,
      muebles: data.muebles.map((m) => completar(m) as Mueble),
      granitos: data.granitos.map((g) => completar(g) as Granito),
    }
  }

  async destacar(id: string, destacado: boolean) {
    const { data } = await this.http.post<{ destacado: boolean; codigoPublico?: string }>(`/disenos/${id}/destacar`, { destacado })
    return data
  }

  async duplicar(id: string): Promise<Diseno> {
    const { data } = await this.http.post<{ diseno: Diseno }>(`/disenos/${id}/duplicar`)
    return data.diseno
  }
}
