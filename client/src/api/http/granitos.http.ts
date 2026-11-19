import type { AxiosInstance } from 'axios'
import type { Pagina } from '../../dominio/comun'
import type { EntradaGranito, FiltrosGranitos, Granito } from '../../dominio/granito'
import type { GranitosApi } from '../contratos'
import { aPagina, parametrosPaginados, type MetadatosPagina } from './parametros'

/** Arma el multipart: campos de texto + el archivo en el campo `imagen`. */
function armarFormData(datos: Partial<EntradaGranito>, imagen?: File): FormData {
  const form = new FormData()
  if (datos.nombre !== undefined) form.append('nombre', datos.nombre)
  if (datos.tipo !== undefined) form.append('tipo', datos.tipo)
  if (datos.acabado !== undefined) form.append('acabado', datos.acabado)
  // Un arreglo vacío no viajaría en multipart: el backend entiende `''` como "sin etiquetas".
  if (datos.etiquetas !== undefined) {
    if (datos.etiquetas.length === 0) form.append('etiquetas', '')
    else datos.etiquetas.forEach((e) => form.append('etiquetas', e))
  }
  if (datos.precioM2 !== undefined) form.append('precioM2', String(datos.precioM2))
  if (imagen !== undefined) form.append('imagen', imagen)
  return form
}

export class GranitosApiHttp implements GranitosApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async listar(filtros: FiltrosGranitos): Promise<Pagina<Granito>> {
    const { data } = await this.http.get<{ granitos: Granito[] } & MetadatosPagina>('/granitos', {
      params: parametrosPaginados(filtros),
    })
    return aPagina(data.granitos, data)
  }

  async obtener(id: string): Promise<Granito> {
    const { data } = await this.http.get<{ granito: Granito }>(`/granitos/${id}`)
    return data.granito
  }

  async crear(datos: EntradaGranito, imagen: File): Promise<Granito> {
    const { data } = await this.http.post<{ granito: Granito }>('/granitos', armarFormData(datos, imagen))
    return data.granito
  }

  async actualizar(id: string, datos: Partial<EntradaGranito>, imagen?: File): Promise<Granito> {
    const { data } = await this.http.patch<{ granito: Granito }>(`/granitos/${id}`, armarFormData(datos, imagen))
    return data.granito
  }

  async desactivar(id: string): Promise<void> {
    await this.http.delete(`/granitos/${id}`)
  }
}
