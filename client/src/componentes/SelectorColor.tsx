import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { ColorPaleta } from '../dominio/paleta'

interface Props {
  etiqueta: string
  paleta: ColorPaleta[]
  valor: string
  onCambiar: (hex: string) => void
}

/** Muestras de la paleta de las fotos + un selector libre para cualquier otro color. */
export function SelectorColor({ etiqueta, paleta, valor, onCambiar }: Props) {
  const nombre = paleta.find((c) => c.hex.toLowerCase() === valor.toLowerCase())?.nombre ?? valor
  return (
    <Box role="group" aria-label={etiqueta}>
      <Typography variant="body2" sx={{ mb: 0.75 }}>
        {etiqueta}: <strong>{nombre}</strong>
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
        {paleta.map((c) => {
          const activo = c.hex.toLowerCase() === valor.toLowerCase()
          return (
            <Tooltip key={c.hex} title={c.nombre}>
              <ButtonBase
                aria-label={c.nombre}
                aria-pressed={activo}
                onClick={() => onCambiar(c.hex)}
                sx={{
                  width: 30, height: 30, borderRadius: '50%', bgcolor: c.hex, border: 1, borderColor: 'divider',
                  ...(activo ? { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 } : {}),
                }}
              />
            </Tooltip>
          )
        })}
        <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: 'text.secondary', ml: 0.5 }}>
          Otro
          <input
            type="color"
            value={valor}
            onChange={(e) => onCambiar(e.target.value)}
            style={{ width: 34, height: 30, border: 0, padding: 0, background: 'none' }}
          />
        </Box>
      </Box>
    </Box>
  )
}
