import { zodResolver } from '@hookform/resolvers/zod'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { Controller, useForm } from 'react-hook-form'
import { mueblesApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import { ETIQUETA_TIPO_MUEBLE, TIPOS_MUEBLE, type Mueble } from '../../dominio/mueble'
import { esquemaMueble, type FormularioMueble } from '../../esquemas/mueble.esquemas'
import { aplicarErroresApi } from '../../formularios/erroresApi'

interface Props {
  abierto: boolean
  mueble: Mueble | null
  onCerrar: () => void
  onGuardado: () => void
}

export function DialogoMueble({ abierto, mueble, onCerrar, onGuardado }: Props) {
  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="xs">
      {abierto && <Formulario key={mueble?._id ?? 'nuevo'} mueble={mueble} onCerrar={onCerrar} onGuardado={onGuardado} />}
    </Dialog>
  )
}

const MEDIDAS = [
  ['anchoCm', 'Ancho (cm)'],
  ['altoCm', 'Alto (cm)'],
  ['fondoCm', 'Fondo (cm)'],
] as const

function Formulario({ mueble, onCerrar, onGuardado }: Omit<Props, 'abierto'>) {
  const aviso = useAviso()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormularioMueble>({
    resolver: zodResolver(esquemaMueble),
    defaultValues: {
      nombre: mueble?.nombre ?? '',
      tipo: mueble?.tipo ?? 'inferior',
      anchoCm: mueble?.anchoCm ?? 80,
      altoCm: mueble?.altoCm ?? 90,
      fondoCm: mueble?.fondoCm ?? 60,
    },
  })

  const enviar = handleSubmit(async (datos) => {
    try {
      if (mueble === null) await mueblesApi.crear(datos)
      else await mueblesApi.actualizar(mueble._id, datos)
      aviso.mostrar(mueble === null ? 'Mueble creado' : 'Mueble actualizado')
      onGuardado()
    } catch (e) {
      const error = aErrorApi(e)
      if (aplicarErroresApi(error, setError) === 0) aviso.mostrar(error.mensaje, 'error')
    }
  })

  return (
    <Box component="form" onSubmit={enviar} noValidate>
      <DialogTitle>{mueble === null ? 'Nuevo mueble' : 'Editar mueble'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField label="Nombre" required error={errors.nombre !== undefined} helperText={errors.nombre?.message} {...register('nombre')} />
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <TextField select label="Tipo" {...field}>
              {TIPOS_MUEBLE.map((t) => <MenuItem key={t} value={t}>{ETIQUETA_TIPO_MUEBLE[t]}</MenuItem>)}
            </TextField>
          )}
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5 }}>
          {MEDIDAS.map(([campo, etiqueta]) => (
            <TextField
              key={campo}
              label={etiqueta}
              type="number"
              slotProps={{ htmlInput: { min: 1, max: 500 } }}
              error={errors[campo] !== undefined}
              helperText={errors[campo]?.message}
              {...register(campo, { valueAsNumber: true })}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>Guardar</Button>
      </DialogActions>
    </Box>
  )
}
