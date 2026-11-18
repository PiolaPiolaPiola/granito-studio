import { createBrowserRouter } from 'react-router'
import { RutaProtegida } from './auth/RutaProtegida'
import { Layout } from './componentes/Layout'
import { Disenos } from './paginas/disenos/Disenos'
import { Granitos } from './paginas/granitos/Granitos'
import { Login } from './paginas/Login'
import { Muebles } from './paginas/muebles/Muebles'
import { NoEncontrada } from './paginas/NoEncontrada'

/**
 * Las páginas con 3D se cargan con `lazy`: three.js pesa mucho y no tiene por
 * qué descargarse en el login ni en los catálogos.
 */
const editor = () => import('./paginas/editor/EditorPagina').then((m) => ({ Component: m.EditorPagina }))
const prototipo = () => import('./paginas/PrototipoMeson').then((m) => ({ Component: m.PrototipoMeson }))

export const router = createBrowserRouter([
  // Pública: landing de previsualización (sin sesión). Carga diferida por el 3D.
  { path: '/', lazy: () => import('./paginas/landing/Landing').then((m) => ({ Component: m.Landing })) },
  { path: '/login', element: <Login /> },
  {
    element: <RutaProtegida />,
    // Se muestra mientras carga el chunk de una página `lazy` en la primera visita.
    hydrateFallbackElement: <></>,
    children: [
      {
        element: <Layout />,
        children: [
          { path: 'disenos', element: <Disenos /> },
          { path: 'disenos/nuevo', lazy: editor },
          { path: 'disenos/:id', lazy: editor },
          { path: 'granitos', element: <Granitos /> },
          { path: 'muebles', element: <Muebles /> },
          { path: 'prototipo-meson', lazy: prototipo },
        ],
      },
    ],
  },
  { path: '*', element: <NoEncontrada /> },
])
