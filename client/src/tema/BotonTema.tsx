import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { useColorScheme } from '@mui/material/styles'

/**
 * Cambia entre modo claro y oscuro. La primera vez sigue al sistema; al tocarlo, la elección
 * queda guardada en el navegador (MUI lo hace solo).
 */
export function BotonTema({ color = 'inherit' }: { color?: 'inherit' | 'primary' }) {
  const { mode, systemMode, setMode } = useColorScheme()
  const actual = mode === 'system' ? systemMode : mode
  const oscuro = actual === 'dark'
  const texto = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
  return (
    <Tooltip title={texto}>
      <IconButton aria-label={texto} color={color} onClick={() => setMode(oscuro ? 'light' : 'dark')}>
        {oscuro ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  )
}
