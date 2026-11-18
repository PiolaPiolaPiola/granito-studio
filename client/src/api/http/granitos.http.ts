import type { AxiosInstance } from 'axios'
import type { Pagina } from '../../dominio/comun'
import type { EntradaGranito, FiltrosGranitos, Granito } from '../../dominio/granito'
import type { GranitosApi } from '../contratos'
import { limpiarParametros } from './parametros'

/** Arma el multipart: campos de texto + el archivo en el campo `imagen`. */
function armarFormData(datos: Partial<EntradaGranito>, imagen?: File): FormData {
  const form = new FormData()
  if (datos.nombre !== undefined) form.append('nombre', datos.nombre)
  if (datos.tipo !== undefined) form.append('tipo', datos.tipo)
  if (datos.acabado !== undefined) form.append('acabado', datos.acabado)
  datos.etiquetas?.forEach((e) => form.append('etiquetas', e))
  if (imagen !== undefined) form.append('imagen', imagen)
  return form
}

export class GranitosApiHttp implements GranitosApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async listar(filtros: FiltrosGranitos): Promise<Pagina<Granito>> {
    const { data } = await this.http.get<Pagina<Granito>>('/granitos', { params: limpiarParametros(filtros) })
    return data
  }

  async obtener(id: string): Promise<Granito> {
    const { data } = await this.http.get<Granito>(`/granitos/${id}`)
    return data
  }

  async crear(datos: EntradaGranito, imagen: File): Promise<Granito> {
    const { data } = await this.http.post<Granito>('/granitos', armarFormData(datos, imagen))
    return data
  }

  async actualizar(id: string, datos: Partial<EntradaGranito>, imagen?: File): Promise<Granito> {
    const { data } = await this.http.patch<Granito>(`/granitos/${id}`, armarFormData(datos, imagen))
    return data
  }

  async desactivar(id: string): Promise<void> {
    await this.http.delete(`/granitos/${id}`)
  }
}
