import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './useAuth'

/** Envuelve las rutas privadas: sin sesión redirige al login y recuerda a dónde quería ir. */
export function RutaProtegida() {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <CircularProgress aria-label="Verificando sesión" />
      </Box>
    )
  }
  if (usuario === null) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  return <Outlet />
}
