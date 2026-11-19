import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useRef, useState } from 'react'
import { disenosApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useAviso } from '../../componentes/aviso/AvisoContext'

interface Props {
  idDiseno?: string
  fondoUrl?: string
  onCambio: (fondoUrl: string | undefined) => void
}

/**
 * Foto del espacio real del cliente: el diseño 3D se ve encima (con el botón de la foto en la
 * barra de la vista). Se acomoda la cámara para que coincida con la foto. Es privada: no sale
 * en el enlace público.
 */
export function BotonFotoEspacio({ idDiseno, fondoUrl, onCambio }: Props) {
  const aviso = useAviso()
  const entrada = useRef<HTMLInputElement>(null)
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  const subir = async (archivo: File | undefined) => {
    if (archivo === undefined || idDiseno === undefined) return
    setSubiendo(true)
    try {
      const diseno = await disenosApi.subirFondo(idDiseno, archivo)
      onCambio(diseno.fondoUrl)
      aviso.mostrar('Foto cargada. Gira y acerca la cámara hasta que el diseño encaje con la foto.')
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    } finally {
      setSubiendo(false)
      if (entrada.current) entrada.current.value = ''
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
      <Button variant="outlined" startIcon={<AddPhotoAlternateOutlined />} onClick={abrir} disabled={subiendo}>
        {subiendo ? 'Subiendo…' : 'Foto del espacio'}
      </Button>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void subir(e.target.files?.[0])} />
      <Menu anchorEl={menu} open={menu !== null} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setMenu(null); entrada.current?.click() }}>Cambiar la foto</MenuItem>
        <MenuItem onClick={() => void quitar()}>Quitar la foto</MenuItem>
      </Menu>
    </>
  )
}
