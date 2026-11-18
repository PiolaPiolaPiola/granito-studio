import { createContext } from 'react'
import type { Usuario } from '../dominio/usuario'

export interface ValorAuth {
  usuario: Usuario | null
  /** true mientras se valida un token guardado con /auth/me al abrir la app. */
  cargando: boolean
  ingresar(email: string, contrasena: string): Promise<void>
  salir(): void
}

export const AuthContext = createContext<ValorAuth | null>(null)
