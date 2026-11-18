import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

interface Props {
  imagenUrl: string
  alt?: string
  sx?: SxProps<Theme>
}

/** Cuadro con la textura del granito (usa la misma `imagenUrl` que la escena 3D). */
export function MuestraGranito({ imagenUrl, alt = '', sx }: Props) {
  return (
    <Box
      role={alt === '' ? 'presentation' : 'img'}
      aria-label={alt === '' ? undefined : alt}
      sx={[
        { backgroundImage: `url("${imagenUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center', border: 1, borderColor: 'divider' },
        ...(Array.isArray(sx) ? sx : sx === undefined ? [] : [sx]),
      ]}
    />
  )
}
