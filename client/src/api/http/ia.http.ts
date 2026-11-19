import type { AxiosInstance } from 'axios'
import type {
  AccionVoz,
  ContextoComando,
  EstadoIa,
  RespuestaIa,
  SugerenciaGranito,
  SugerenciaMueble,
} from '../../ia/tipos'
import type { IaApi } from '../contratos'

/** Las llamadas de IA pueden tardar (modelos gratuitos): más margen que el resto. */
const LIMITE_MS = 60_000

export class IaApiHttp implements IaApi {
  private readonly http: AxiosInstance
  private estadoGuardado: Promise<EstadoIa> | null = null

  constructor(http: AxiosInstance) {
    this.http = http
  }

  /** El estado no cambia mientras corre el servidor: se pregunta una sola vez. */
  estado(): Promise<EstadoIa> {
    this.estadoGuardado ??= this.http
      .get<EstadoIa>('/ia/estado')
      .then(({ data }) => data)
      .catch((error: unknown) => {
        this.estadoGuardado = null
        throw error
      })
    return this.estadoGuardado
  }

  async analizarFoto<T extends 'mueble' | 'granito'>(tipo: T, imagen: Blob) {
    const form = new FormData()
    form.append('tipo', tipo)
    form.append('imagen', imagen, 'foto.jpg')
    const { data } = await this.http.post<RespuestaIa & { sugerencia: T extends 'mueble' ? SugerenciaMueble : SugerenciaGranito }>(
      '/ia/analizar-foto',
      form,
      { timeout: LIMITE_MS },
    )
    return data
  }

  async interpretar(texto: string, contexto: ContextoComando) {
    const { data } = await this.http.post<RespuestaIa & { acciones: AccionVoz[] }>(
      '/ia/interpretar',
      { texto, contexto },
      { timeout: LIMITE_MS },
    )
    return data
  }

  async transcribir(audio: Blob, nombre: string) {
    const form = new FormData()
    form.append('audio', audio, nombre)
    const { data } = await this.http.post<{ texto: string; proveedor: string }>('/ia/transcribir', form, { timeout: LIMITE_MS })
    return data
  }
}
