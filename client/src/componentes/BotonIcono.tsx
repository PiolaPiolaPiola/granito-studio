import IconButton, { type IconButtonProps } from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

/**
 * Botón de ícono con tooltip: el texto sale de `aria-label` (el mismo que leen los lectores
 * de pantalla), así cada botón dice qué hace al pasar el mouse. El `span` permite mostrar
 * el tooltip aunque el botón esté deshabilitado.
 */
export default function BotonIcono(props: IconButtonProps) {
  const titulo = props['aria-label']
  const boton = <IconButton {...props} />
  if (titulo === undefined || titulo === '') return boton
  return (
    <Tooltip title={titulo}>
      <span style={{ display: 'inline-flex' }}>{boton}</span>
    </Tooltip>
  )
}
