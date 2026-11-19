import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useRef, useState } from 'react'
import { disenosApi, iaApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import { ConfirmarDialogo } from '../../componentes/ConfirmarDialogo'
import type { EntradaDiseno } from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import { espacioDe, type Mueble } from '../../dominio/mueble'
import { cargarImagen, colorDeFranja } from '../../ia/colores'
import { reducirImagen } from '../../ia/reducirImagen'
import type { AccionVoz } from '../../ia/tipos'
import { aplicarAcciones } from '../../voz/aplicarAcciones'

interface Props {
  idDiseno?: string
  fondoUrl?: string
  onCambio: (fondoUrl: string | undefined) => void
  obtenerDiseno: () => EntradaDiseno
  catalogo: Mueble[]
  granitos: Granito[]
  onAplicar: (diseno: EntradaDiseno) => void
}

/**
 * Foto del espacio real del cliente.
 * - Se puede ver el diseño 3D encima (botón de la foto en la barra de la vista).
 * - "Generar el diseño desde la foto": con IA configurada, reconoce muebles, mesón, colores y
 *   objetos y arma el diseño con el catálogo. Sin IA, toma solo los colores de pared y piso.
 * Es privada: no sale en el enlace público.
 */
export function BotonFotoEspacio({ idDiseno, fondoUrl, onCambio, obtenerDiseno, catalogo, granitos, onAplicar }: Props) {
  const aviso = useAviso()
  const entrada = useRef<HTMLInputElement>(null)
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const [trabajando, setTrabajando] = useState<string | null>(null)
  const [preguntar, setPreguntar] = useState<string | null>(null)

  const subir = async (archivo: File | undefined) => {
    if (archivo === undefined || idDiseno === undefined) return
    setTrabajando('Subiendo…')
    try {
      const diseno = await disenosApi.subirFondo(idDiseno, archivo)
      onCambio(diseno.fondoUrl)
      if (diseno.fondoUrl !== undefined) setPreguntar(diseno.fondoUrl)
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    } finally {
      setTrabajando(null)
      if (entrada.current) entrada.current.value = ''
    }
  }

  const generar = async (url: string) => {
    setPreguntar(null)
    setTrabajando('Analizando la foto…')
    try {
      const actual = obtenerDiseno()
      const blob = await (await fetch(url)).blob()
      const estado = await iaApi.estado().catch(() => null)

      if (estado?.disponible === true) {
        const delEspacio = catalogo.filter((m) => espacioDe(m) === actual.espacio)
        const { acciones, proveedor } = await iaApi.analizarEspacio(await reducirImagen(blob), {
          espacio: actual.espacio,
          muebles: (delEspacio.length > 0 ? delEspacio : catalogo).map((m) => m.nombre).slice(0, 80),
          piedras: granitos.map((g) => g.nombre).slice(0, 60),
        })
        // Se arma desde cero: los muebles, materiales y objetos los pone la foto.
        const base: EntradaDiseno = { ...actual, muebles: [], materiales: [], objetos: [] }
        const { diseno, hechas, fallidas } = aplicarAcciones(base, acciones, catalogo, granitos)
        onAplicar(diseno)
        aviso.mostrar(`Diseño generado con IA (${proveedor}). Revísalo y toca Guardar.`, fallidas.length > 0 ? 'warning' : 'success', {
          titulo: 'Diseño desde la foto',
          detalle: [...hechas, ...fallidas].slice(0, 12),
        })
        return
      }

      // Sin IA: solo colores (la parte alta suele ser pared y la baja, piso).
      const imagen = await cargarImagen(blob)
      const acciones: AccionVoz[] = [
        { tipo: 'entorno', parte: 'pared', color: colorDeFranja(imagen, 0.05, 0.3) },
        { tipo: 'entorno', parte: 'piso', color: colorDeFranja(imagen, 0.8, 0.98) },
      ]
      onAplicar(aplicarAcciones(actual, acciones, catalogo, granitos).diseno)
      aviso.mostrar(
        'Tomé los colores de la pared y el piso. Para reconocer muebles y mesones hay que configurar una clave de IA gratuita en el servidor (ver README).',
        'info',
        { titulo: 'Sin IA configurada' },
      )
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    } finally {
      setTrabajando(null)
    }
  }

  const quitar = async () => {
    setMenu(null)
    if (idDiseno === undefined) return
    try {
      await disenosApi.quitarFondo(idDiseno)
      onCambio(undefined)
      aviso.mostrar('Foto quitada')
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    }
  }

  const abrir = (e: React.MouseEvent<HTMLElement>) => {
    if (idDiseno === undefined) {
      aviso.mostrar('Guarda el diseño primero para poder cargar la foto del espacio', 'info')
      return
    }
    if (fondoUrl === undefined) entrada.current?.click()
    else setMenu(e.currentTarget)
  }

  return (
    <>
      <Button variant="outlined" startIcon={<AddPhotoAlternateOutlined />} onClick={abrir} disabled={trabajando !== null}>
        {trabajando ?? 'Foto del espacio'}
      </Button>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void subir(e.target.files?.[0])} />
      <Menu anchorEl={menu} open={menu !== null} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setMenu(null); if (fondoUrl !== undefined) setPreguntar(fondoUrl) }}>Generar el diseño desde la foto</MenuItem>
        <MenuItem onClick={() => { setMenu(null); entrada.current?.click() }}>Cambiar la foto</MenuItem>
        <MenuItem onClick={() => void quitar()}>Quitar la foto</MenuItem>
      </Menu>
      <ConfirmarDialogo
        abierto={preguntar !== null}
        titulo="¿Generar el diseño desde la foto?"
        mensaje="Se reconocen los muebles, el mesón, los colores y los objetos de la foto y se arma el diseño con el catálogo. Reemplaza los muebles y materiales actuales (no se guarda hasta que toques Guardar)."
        textoConfirmar="Generar"
        onConfirmar={() => { if (preguntar !== null) void generar(preguntar) }}
        onCancelar={() => { setPreguntar(null); aviso.mostrar('Foto cargada. Gira y acerca la cámara hasta que el diseño encaje con la foto.') }}
      />
    </>
  )
}
