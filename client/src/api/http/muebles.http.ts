import type { AxiosInstance } from 'axios'
import type { Pagina } from '../../dominio/comun'
import type { EntradaMueble, FiltrosMuebles, Mueble } from '../../dominio/mueble'
import type { CambiosFotoMueble, MueblesApi } from '../contratos'
import { aPagina, parametrosPaginados, type MetadatosPagina } from './parametros'

/** Multipart: los campos como texto y la foto (opcional) en `imagen`. */
function armarFormData(datos: Partial<EntradaMueble>, foto: CambiosFotoMueble = {}): FormData {
  const form = new FormData()
  for (const [campo, valor] of Object.entries(datos)) {
    if (valor !== undefined) form.append(campo, String(valor))
  }
  if (foto.imagen !== undefined) form.append('imagen', foto.imagen)
  if (foto.quitarImagen === true) form.append('quitarImagen', 'true')
  return form
}

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

  async crear(datos: EntradaMueble, imagen?: File): Promise<Mueble> {
    const { data } = await this.http.post<{ mueble: Mueble }>('/muebles', armarFormData(datos, { imagen }))
    return data.mueble
  }

  async actualizar(id: string, datos: Partial<EntradaMueble>, foto?: CambiosFotoMueble): Promise<Mueble> {
    const { data } = await this.http.patch<{ mueble: Mueble }>(`/muebles/${id}`, armarFormData(datos, foto))
    return data.mueble
  }

  async desactivar(id: string): Promise<void> {
    await this.http.delete(`/muebles/${id}`)
  }
}
