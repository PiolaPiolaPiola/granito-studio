import { zodResolver } from '@hookform/resolvers/zod'
import DiamondOutlined from '@mui/icons-material/DiamondOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { aErrorApi } from '../api/errores'
import { useAuth } from '../auth/useAuth'
import { esquemaLogin, type EntradaLogin } from '../esquemas/auth.esquemas'
import { aplicarErroresApi } from '../formularios/erroresApi'

export function Login() {
  const { usuario, ingresar } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EntradaLogin>({ resolver: zodResolver(esquemaLogin), defaultValues: { email: '', contrasena: '' } })

  const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? '/'
  if (usuario !== null) return <Navigate to={destino} replace />

  const enviar = handleSubmit(async (datos) => {
    setErrorGeneral(null)
    try {
      await ingresar(datos.email, datos.contrasena)
      navegar(destino, { replace: true })
    } catch (e) {
      const error = aErrorApi(e)
      // 400 con detalles → error en el campo; 401/429/red → mensaje general (incluye "demasiados intentos").
      if (aplicarErroresApi(error, setError) === 0) setErrorGeneral(error.mensaje)
    }
  })

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', minHeight: '100dvh' }}>
      <Box sx={{ flex: '1 1 420px', display: 'grid', placeItems: 'center', p: 4 }}>
        <Paper
          component="form"
          onSubmit={enviar}
          noValidate
          variant="outlined"
          sx={{ width: '100%', maxWidth: 380, p: 5, display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'primary.main' }}>
            <DiamondOutlined fontSize="large" />
            <Typography component="h1" variant="h1" color="text.primary">
              Granito Studio
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Ingresa a tu espacio de trabajo. Esta herramienta es de uso interno.
          </Typography>
          {errorGeneral !== null && <Alert severity="error">{errorGeneral}</Alert>}
          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="username"
            required
            error={errors.email !== undefined}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            error={errors.contrasena !== undefined}
            helperText={errors.contrasena?.message}
            {...register('contrasena')}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
          <Typography variant="caption" color="text.secondary" align="center">
            Granitos y Mármoles · Colombia
          </Typography>
        </Paper>
      </Box>
      <Box
        aria-hidden="true"
        sx={{
          flex: '1.2 1 480px',
          minHeight: 320,
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, #efece6 0%, #d9d4cb 32%, #c9c2b4 33%, #e7e2d8 52%, #d2ccbf 76%, #efece6 100%)',
        }}
      >
        <Typography sx={{ fontSize: 60, fontWeight: 700, letterSpacing: 2, color: 'rgba(62,59,56,0.55)', textAlign: 'center', px: 4 }}>
          Granito Studio
        </Typography>
      </Box>
    </Box>
  )
}
