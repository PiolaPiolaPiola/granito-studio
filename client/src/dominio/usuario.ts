import type { ConTiempos } from './comun'

export type Rol = 'admin' | 'vendedor'

export interface Usuario extends ConTiempos {
  email: string
  rol: Rol
  active: boolean
}

export interface SesionIniciada {
  token: string
  usuario: Usuario
}
