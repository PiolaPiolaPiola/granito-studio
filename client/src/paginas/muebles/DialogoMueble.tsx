import { zodResolver } from '@hookform/resolvers/zod'
import UploadOutlined from '@mui/icons-material/UploadOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { mueblesApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import { SelectorColor } from '../../componentes/SelectorColor'
import {
  espacioDe,
  ESPACIOS,
  ETIQUETA_ESPACIO,
  ETIQUETA_MATERIAL,
  ETIQUETA_TIPO_MUEBLE,
  MATERIALES_MUEBLE,
  materialDe,
  MEDIDAS_TIPICAS,
  TIPOS_POR_ESPACIO,
  type Espacio,
  type Mueble,
  type TipoMueble,
} from '../../dominio/mueble'
import { COLOR_MUEBLE_POR_DEFECTO, PALETA_MUEBLES } from '../../dominio/paleta'
import { esquemaMueble, type FormularioMueble } from '../../esquemas/mueble.esquemas'
import { aplicarErroresApi } from '../../formularios/erroresApi'
import { AnalizarFoto } from '../../ia/AnalizarFoto'

interface Props {
  abierto: boolean
  mueble: Mueble | null
  /** Espacio sugerido al crear (el filtro activo de la página). */
  espacioInicial?: Espacio
  onCerrar: () => void
  onGuardado: () => void
}

export function DialogoMueble({ abierto, mueble, espacioInicial, onCerrar, onGuardado }: Props) {
  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="sm">
      {abierto && (
        <Formulario
          key={mueble?._id ?? 'nuevo'}
          mueble={mueble}
          espacioInicial={espacioInicial}
          onCerrar={onCerrar}
          onGuardado={onGuardado}
        />
      )}
    </Dialog>
  )
}

const MEDIDAS = [
  ['anchoCm', 'Ancho (cm)'],
  ['altoCm', 'Alto (cm)'],
  ['fondoCm', 'Fondo (cm)'],
] as const

function Formulario({ mueble, espacioInicial, onCerrar, onGuardado }: Omit<Props, 'abierto'>) {
  const aviso = useAviso()
  const espacio0 = mueble ? espacioDe(mueble) : (espacioInicial ?? 'cocina')
  const tipo0: TipoMueble = mueble?.tipo ?? TIPOS_POR_ESPACIO[espacio0][0]
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormularioMueble>({
    resolver: zodResolver(esquemaMueble),
    defaultValues: {
      nombre: mueble?.nombre ?? '',
      espacio: espacio0,
      tipo: tipo0,
      material: mueble ? materialDe(mueble) : 'madera',
      colorHex: mueble?.colorHex ?? COLOR_MUEBLE_POR_DEFECTO,
      ...(mueble ?? MEDIDAS_TIPICAS[tipo0]),
      quitarImagen: false,
    },
  })
  const espacio = useWatch({ control, name: 'espacio' })
  const quitarImagen = useWatch({ control, name: 'quitarImagen' })

  const elegirArchivo = (archivo: File | undefined) => {
    setValue('imagen', archivo)
    setValue('quitarImagen', false)
    setVistaPrevia(archivo === undefined ? null : URL.createObjectURL(archivo))
  }

  /** Al cambiar de tipo en un mueble nuevo, se proponen sus medidas típicas. */
  const cambiarTipo = (tipo: TipoMueble) => {
    setValue('tipo', tipo, { shouldValidate: true })
    if (mueble === null) {
      for (const [campo, valor] of Object.entries(MEDIDAS_TIPICAS[tipo])) {
        setValue(campo as keyof typeof MEDIDAS_TIPICAS.inferior, valor)
      }
    }
  }

  const cambiarEspacio = (nuevo: Espacio) => {
    setValue('espacio', nuevo)
    if (!TIPOS_POR_ESPACIO[nuevo].includes(getValues('tipo'))) cambiarTipo(TIPOS_POR_ESPACIO[nuevo][0])
  }

  const enviar = handleSubmit(async ({ imagen, quitarImagen: quitar, ...datos }) => {
    try {
      if (mueble === null) await mueblesApi.crear(datos, imagen)
      else await mueblesApi.actualizar(mueble._id, datos, { imagen, quitarImagen: quitar })
      aviso.mostrar(mueble === null ? 'Mueble creado' : 'Mueble actualizado')
      onGuardado()
    } catch (e) {
      const error = aErrorApi(e)
      if (aplicarErroresApi(error, setError) === 0) aviso.mostrar(error.mensaje, 'error')
    }
  })

  const fotoActual = vistaPrevia ?? (quitarImagen ? null : (mueble?.imagenUrl ?? null))

  return (
    <Box component="form" onSubmit={enviar} noValidate>
      <DialogTitle>{mueble === null ? 'Nuevo mueble' : 'Editar mueble'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <Box
            component="label"
            sx={{
              flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 2,
              cursor: 'pointer', border: 2, borderStyle: 'dashed', borderColor: 'divider', borderRadius: 2, bgcolor: '#FAF8F4', color: 'primary.main',
              '&:focus-within': { outline: '2px solid', outlineColor: 'primary.main' },
            }}
          >
            {fotoActual === null ? (
              <UploadOutlined fontSize="large" />
            ) : (
              <Box component="img" src={fotoActual} alt="" sx={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 1.5 }} />
            )}
            <Typography variant="body2" color="text.secondary" align="center">
              {fotoActual === null ? 'Foto del mueble (opcional): sirve para llenar los datos y como miniatura del catálogo' : 'Haz clic para cambiar la foto'}
            </Typography>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Foto del mueble"
              onChange={(e) => elegirArchivo(e.target.files?.[0])}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
            />
          </Box>
          <Box sx={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center' }}>
            <AnalizarFoto
              tipo="mueble"
              obtenerArchivo={() => getValues('imagen')}
              onSugerencia={(s) => {
                if (s.nombre) setValue('nombre', s.nombre, { shouldValidate: true })
                if (s.espacio) cambiarEspacio(s.espacio)
                if (s.tipo && TIPOS_POR_ESPACIO[getValues('espacio')].includes(s.tipo)) cambiarTipo(s.tipo)
                if (s.material) setValue('material', s.material)
                if (s.colorHex) setValue('colorHex', s.colorHex)
                if (s.anchoCm) setValue('anchoCm', s.anchoCm)
                if (s.altoCm) setValue('altoCm', s.altoCm)
                if (s.fondoCm) setValue('fondoCm', s.fondoCm)
              }}
            />
            {fotoActual !== null && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setVistaPrevia(null)
                  setValue('imagen', undefined)
                  setValue('quitarImagen', mueble?.imagenUrl !== undefined)
                }}
              >
                Quitar foto
              </Button>
            )}
          </Box>
        </Box>

        <TextField label="Nombre" required error={errors.nombre !== undefined} helperText={errors.nombre?.message} {...register('nombre')} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField select label="Espacio" value={espacio} onChange={(e) => cambiarEspacio(e.target.value as Espacio)} sx={{ flex: '1 1 140px' }}>
            {ESPACIOS.map((e) => <MenuItem key={e} value={e}>{ETIQUETA_ESPACIO[e]}</MenuItem>)}
          </TextField>
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <TextField
                select
                label="Tipo"
                value={field.value}
                onChange={(e) => cambiarTipo(e.target.value as TipoMueble)}
                error={errors.tipo !== undefined}
                helperText={errors.tipo?.message}
                sx={{ flex: '2 1 200px' }}
              >
                {TIPOS_POR_ESPACIO[espacio].map((t) => <MenuItem key={t} value={t}>{ETIQUETA_TIPO_MUEBLE[t]}</MenuItem>)}
              </TextField>
            )}
          />
        </Box>

        <Controller
          control={control}
          name="material"
          render={({ field }) => (
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={field.value}
              onChange={(_, v: FormularioMueble['material'] | null) => v !== null && field.onChange(v)}
              aria-label="Material"
            >
              {MATERIALES_MUEBLE.map((m) => (
                <ToggleButton key={m} value={m} sx={{ minHeight: 44 }}>{ETIQUETA_MATERIAL[m]}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        />

        <Controller
          control={control}
          name="colorHex"
          render={({ field }) => <SelectorColor etiqueta="Color del acabado" paleta={PALETA_MUEBLES} valor={field.value} onCambiar={field.onChange} />}
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
