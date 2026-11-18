import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

export function NoEncontrada() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60dvh', textAlign: 'center', gap: 2, p: 3 }}>
      <Box>
        <Typography component="h1" variant="h1" sx={{ mb: 1 }}>Página no encontrada</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>La dirección no existe o fue movida.</Typography>
        <Button component={Link} to="/" variant="contained">Ir al inicio</Button>
      </Box>
    </Box>
  )
}
