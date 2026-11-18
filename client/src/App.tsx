import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './auth/AuthProvider'
import { AvisoProvider } from './componentes/aviso/AvisoProvider'
import { router } from './rutas'
import { tema } from './tema/tema'

export default function App() {
  return (
    <ThemeProvider theme={tema}>
      <CssBaseline />
      <AvisoProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AvisoProvider>
    </ThemeProvider>
  )
}
