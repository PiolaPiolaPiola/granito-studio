import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import { materialDe, type Mueble } from '../dominio/mueble'
import { COLOR_MUEBLE_POR_DEFECTO } from '../dominio/paleta'

interface Props {
  mueble: Pick<Mueble, 'nombre' | 'imagenUrl' | 'colorHex' | 'material'>
  sx?: SxProps<Theme>
}

/** Fondo que sugiere el material cuando el mueble no tiene foto. */
function fondoDeMaterial(color: string, material: ReturnType<typeof materialDe>): string {
  if (material === 'metal') {
    return `linear-gradient(135deg, ${color} 0%, #ffffff66 45%, ${color} 55%, #00000033 100%), ${color}`
  }
  if (material === 'lacado') {
    return `linear-gradient(160deg, #ffffff44 0%, transparent 40%), ${color}`
  }
  // Madera: franjas suaves que imitan la veta.
  return `repeating-linear-gradient(90deg, #00000010 0px, #00000010 2px, transparent 2px, transparent 9px), linear-gradient(90deg, ${color}, ${color})`
}

/** Foto del mueble o, si no tiene, una muestra de su material y color. */
export function MiniaturaMueble({ mueble, sx }: Props) {
  if (mueble.imagenUrl !== undefined) {
    return <Box component="img" src={mueble.imagenUrl} alt={mueble.nombre} loading="lazy" sx={{ display: 'block', width: '100%', objectFit: 'cover', ...sx }} />
  }
  return (
    <Box
      role="img"
      aria-label={mueble.nombre}
      sx={{ width: '100%', background: fondoDeMaterial(mueble.colorHex ?? COLOR_MUEBLE_POR_DEFECTO, materialDe(mueble)), ...sx }}
    />
  )
}
