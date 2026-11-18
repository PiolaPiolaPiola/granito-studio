import type { AxiosInstance } from 'axios'
import type { SesionIniciada, Usuario } from '../../dominio/usuario'
import type { AuthApi } from '../contratos'

export class AuthApiHttp implements AuthApi {
  private readonly http: AxiosInstance

  constructor(http: AxiosInstance) {
    this.http = http
  }

  async ingresar(email: string, contrasena: string): Promise<SesionIniciada> {
    const { data } = await this.http.post<SesionIniciada>('/auth/login', { email, contrasena })
    return data
  }

  async yo(): Promise<Usuario> {
    const { data } = await this.http.get<{ usuario: Usuario }>('/auth/me')
    return data.usuario
  }
}
