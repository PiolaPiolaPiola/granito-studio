import axios from 'axios'
import { almacenToken } from '../infra/almacenamiento'
import { aErrorApi } from './errores'

/** En desarrollo Vite reenvía /api al puerto 4000; en producción Express sirve todo desde el mismo origen. */
export const clienteHttp = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
})

let alExpirarSesion: (() => void) | null = null

/** El contexto de auth se registra aquí para enterarse de un 401 sin que este módulo dependa de React. */
export function registrarAlExpirarSesion(manejador: (() => void) | null): void {
  alExpirarSesion = manejador
}

clienteHttp.interceptors.request.use((config) => {
  const token = almacenToken.leer()
  if (token !== null) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

clienteHttp.interceptors.response.use(
  (respuesta) => respuesta,
  (error: unknown) => {
    const errorApi = aErrorApi(error)
    const esLogin = axios.isAxiosError(error) && error.config?.url?.includes('/auth/login') === true
    // 401 fuera del login = token vencido o inválido: se cierra la sesión.
    if (errorApi.estado === 401 && !esLogin) {
      almacenToken.borrar()
      alExpirarSesion?.()
    }
    return Promise.reject(errorApi)
  },
)
