import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api'
import { registrarAlExpirarSesion } from '../api/clienteHttp'
import type { Usuario } from '../dominio/usuario'
import { almacenToken } from '../infra/almacenamiento'
import { AuthContext, type ValorAuth } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  // Si hay un token guardado, hay que validarlo antes de decidir a dónde ir.
  const [cargando, setCargando] = useState(() => almacenToken.leer() !== null)

  useEffect(() => {
    registrarAlExpirarSesion(() => setUsuario(null))
    return () => registrarAlExpirarSesion(null)
  }, [])

  useEffect(() => {
    if (almacenToken.leer() === null) return
    let vigente = true
    authApi
      .yo()
      .then((u) => vigente && setUsuario(u))
      .catch(() => almacenToken.borrar())
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [])

  const ingresar = useCallback(async (email: string, contrasena: string) => {
    const sesion = await authApi.ingresar(email, contrasena)
    almacenToken.guardar(sesion.token)
    setUsuario(sesion.usuario)
  }, [])

  const salir = useCallback(() => {
    almacenToken.borrar()
    setUsuario(null)
  }, [])

  const valor = useMemo<ValorAuth>(() => ({ usuario, cargando, ingresar, salir }), [usuario, cargando, ingresar, salir])
  return <AuthContext value={valor}>{children}</AuthContext>
}
