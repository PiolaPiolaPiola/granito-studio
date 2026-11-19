import { zodResolver } from '@hookform/resolvers/zod'
import UploadOutlined from '@mui/icons-material/UploadOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { granitosApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import { MuestraGranito } from '../../componentes/MuestraGranito'
import {
  ACABADOS,
  ETIQUETA_ACABADO,
  ETIQUETA_TIPO_PIEDRA,
  parsearEtiquetas,
  TIPOS_PIEDRA,
  type Granito,
} from '../../dominio/granito'
import { crearEsquemaGranito, type FormularioGranito } from '../../esquemas/granito.esquemas'
import { aplicarErroresApi } from '../../formularios/erroresApi'
import { AnalizarFoto } from '../../ia/AnalizarFoto'

interface Props {
  abierto: boolean
  /** Si viene, el diálogo edita ese granito; si no, crea uno nuevo. */
  granito: Granito | null
  onCerrar: () => void
  onGuardado: () => void
}

export function DialogoGranito({ abierto, granito, onCerrar, onGuardado }: Props) {
  // key fuerza un formulario nuevo cada vez que se abre con otro granito
  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="sm">
      {abierto && <Formulario key={granito?._id ?? 'nuevo'} granito={granito} onCerrar={onCerrar} onGuardado={onGuardado} />}
    </Dialog>
  )
}

function Formulario({ granito, onCerrar, onGuardado }: Omit<Props, 'abierto'>) {
  const aviso = useAviso()
  const editando = granito !== null
  const esquema = useMemo(() => crearEsquemaGranito(!editando), [editando])
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormularioGranito>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: granito?.nombre ?? '',
      tipo: granito?.tipo ?? 'granito',
      acabado: granito?.acabado ?? 'brillante',
      etiquetasTexto: granito?.etiquetas.join(', ') ?? '',
      precioTexto: granito?.precioM2?.toString() ?? '',
    },
  })

  const elegirArchivo = (archivo: File | undefined) => {
    setValue('imagen', archivo, { shouldValidate: true })
    setVistaPrevia(archivo === undefined ? null : URL.createObjectURL(archivo))
  }

  const enviar = handleSubmit(async (datos) => {
    const precio = datos.precioTexto.trim()
    const entrada = {
      nombre: datos.nombre,
      tipo: datos.tipo,
      acabado: datos.acabado,
      etiquetas: parsearEtiquetas(datos.etiquetasTexto),
      ...(precio === '' ? {} : { precioM2: Number(precio) }),
    }
    try {
      if (granito === null) await granitosApi.crear(entrada, datos.imagen as File)
      else await granitosApi.actualizar(granito._id, entrada, datos.imagen)
      aviso.mostrar(editando ? 'Granito actualizado' : 'Granito guardado')
      onGuardado()
    } catch (e) {
      const error = aErrorApi(e)
      const asignados = aplicarErroresApi(error, setError, { etiquetas: 'etiquetasTexto', imagenUrl: 'imagen' })
      if (asignados === 0) aviso.mostrar(error.mensaje, 'error')
    }
  })

  const imagenActual = vistaPrevia ?? granito?.imagenUrl ?? null

  return (
    <Box component="form" onSubmit={enviar} noValidate>
      <DialogTitle>{editando ? 'Editar granito' : 'Subir granito'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box
          component="label"
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 3, cursor: 'pointer',
            border: 2, borderStyle: 'dashed', borderColor: errors.imagen ? 'error.main' : 'divider', borderRadius: 2, bgcolor: 'suave', color: 'primary.main',
            '&:focus-within': { outline: '2px solid', outlineColor: 'primary.main' },
          }}
        >
          {imagenActual === null ? <UploadOutlined fontSize="large" /> : <MuestraGranito imagenUrl={imagenActual} sx={{ width: 96, height: 96, borderRadius: 2 }} />}
          <Typography variant="body2" color="text.secondary" align="center">
            {imagenActual === null ? 'Haz clic para seleccionar la foto de la textura' : 'Haz clic para cambiar la foto'}
          </Typography>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => elegirArchivo(e.target.files?.[0])}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          />
        </Box>
        {errors.imagen && <FormHelperText error>{errors.imagen.message}</FormHelperText>}
        <AnalizarFoto
          tipo="granito"
          obtenerArchivo={() => getValues('imagen')}
          onSugerencia={(s) => {
            if (s.nombre !== undefined && getValues('nombre').trim() === '') setValue('nombre', s.nombre, { shouldValidate: true })
            if (s.tipo !== undefined) setValue('tipo', s.tipo)
            if (s.acabado !== undefined) setValue('acabado', s.acabado)
            if (s.etiquetas !== undefined) {
              const actuales = parsearEtiquetas(getValues('etiquetasTexto'))
              setValue('etiquetasTexto', [...new Set([...actuales, ...s.etiquetas])].join(', '), { shouldValidate: true })
            }
          }}
        />

        <TextField label="Nombre" required error={errors.nombre !== undefined} helperText={errors.nombre?.message} {...register('nombre')} />
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <TextField select label="Tipo" {...field}>
              {TIPOS_PIEDRA.map((t) => (
                <MenuItem key={t} value={t}>{ETIQUETA_TIPO_PIEDRA[t]}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <FormControl>
          <FormLabel id="acabado-etiqueta">Acabado</FormLabel>
          <Controller
            control={control}
            name="acabado"
            render={({ field }) => (
              <RadioGroup row aria-labelledby="acabado-etiqueta" {...field}>
                {ACABADOS.map((a) => (
                  <FormControlLabel key={a} value={a} control={<Radio />} label={ETIQUETA_ACABADO[a]} />
                ))}
              </RadioGroup>
            )}
          />
        </FormControl>
        <TextField
          label="Precio por m² instalado (opcional)"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 1000 }, input: { startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> } }}
          error={errors.precioTexto !== undefined}
          helperText={errors.precioTexto?.message ?? 'Se usa en la cotización del diseño'}
          {...register('precioTexto')}
        />
        <TextField
          label="Etiquetas (separadas por comas)"
          placeholder="negro, moderno, elegante"
          error={errors.etiquetasTexto !== undefined}
          helperText={errors.etiquetasTexto?.message}
          {...register('etiquetasTexto')}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {editando ? 'Guardar cambios' : 'Guardar granito'}
        </Button>
      </DialogActions>
    </Box>
  )
}
