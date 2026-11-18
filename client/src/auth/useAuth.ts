import { useContext } from 'react'
import { AuthContext, type ValorAuth } from './AuthContext'

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext)
  if (valor === null) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return valor
}

export function useEsAdmin(): boolean {
  return useAuth().usuario?.rol === 'admin'
}
