import ThreeDRotationOutlined from '@mui/icons-material/ThreeDRotationOutlined'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import KitchenOutlined from '@mui/icons-material/KitchenOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import PanoramaOutlined from '@mui/icons-material/PanoramaOutlined'
import ScienceOutlined from '@mui/icons-material/ScienceOutlined'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'

const ANCHO_MENU = 232

interface Enlace {
  a: string
  etiqueta: string
  icono: ReactNode
}

const ENLACES: Enlace[] = [
  { a: '/disenos/nuevo', etiqueta: 'Editor', icono: <ThreeDRotationOutlined /> },
  { a: '/granitos', etiqueta: 'Granitos', icono: <PanoramaOutlined /> },
  { a: '/muebles', etiqueta: 'Muebles', icono: <KitchenOutlined /> },
  { a: '/disenos', etiqueta: 'Diseños', icono: <FolderOutlined /> },
]

/** El prototipo del mesón (F2) solo aparece en desarrollo. */
const ENLACES_DEV: Enlace[] = import.meta.env.DEV
  ? [{ a: '/prototipo-meson', etiqueta: 'Prototipo mesón', icono: <ScienceOutlined /> }]
  : []

export function Layout() {
  const tema = useTheme()
  const esEscritorio = useMediaQuery(tema.breakpoints.up('md'))
  const [abierto, setAbierto] = useState(false)
  const { usuario, salir } = useAuth()
  const navegar = useNavigate()

  const cerrarSesion = () => {
    salir()
    navegar('/login', { replace: true })
  }

  const menu = (
    <Box component="nav" aria-label="Navegación principal" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography sx={{ px: 3, py: 2.5, fontSize: 20, fontWeight: 700, color: 'primary.main' }}>Granito Studio</Typography>
      <Divider />
      <List sx={{ px: 1, py: 1.5, flex: 1 }}>
        {[...ENLACES, ...ENLACES_DEV].map((e) => (
          <ListItemButton
            key={e.a}
            component={NavLink}
            to={e.a}
            end={e.a === '/disenos'}
            onClick={() => setAbierto(false)}
            sx={{
              minHeight: 44,
              borderRadius: 2,
              '&.active': { bgcolor: 'rgba(143,112,66,0.14)', color: 'primary.main', fontWeight: 600, '& .MuiListItemIcon-root': { color: 'primary.main' } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{e.icono}</ListItemIcon>
            <ListItemText primary={e.etiqueta} slotProps={{ primary: { sx: { fontWeight: 'inherit' } } }} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, display: 'block' }}>
          {usuario?.email} · {usuario?.rol}
        </Typography>
        <ListItemButton onClick={cerrarSesion} sx={{ minHeight: 44, borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutOutlined />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      {esEscritorio ? (
        <Drawer variant="permanent" sx={{ width: ANCHO_MENU, flexShrink: 0, '& .MuiDrawer-paper': { width: ANCHO_MENU, boxSizing: 'border-box' } }}>
          {menu}
        </Drawer>
      ) : (
        <>
          <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar>
              <IconButton edge="start" aria-label="Abrir menú" onClick={() => setAbierto(true)}>
                <MenuIcon />
              </IconButton>
              <Typography sx={{ ml: 1, fontWeight: 700, color: 'primary.main' }}>Granito Studio</Typography>
            </Toolbar>
          </AppBar>
          <Drawer open={abierto} onClose={() => setAbierto(false)} sx={{ '& .MuiDrawer-paper': { width: ANCHO_MENU } }}>
            {menu}
          </Drawer>
        </>
      )}
      <Box component="main" sx={{ flex: 1, minWidth: 0, pt: esEscritorio ? 0 : 8 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
