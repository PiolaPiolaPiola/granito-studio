import { zodResolver } from '@hookform/resolvers/zod'
import AddIcon from '@mui/icons-material/Add'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import { useMemo, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { disenosApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import {
  agregarMueble,
  moverMueble,
  quitarMuebleDeDiseno,
  type EntradaDiseno,
} from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import type { Mueble } from '../../dominio/mueble'
import type { MuebleResuelto } from '../../escena/distribucion'
import { esquemaDiseno } from '../../esquemas/diseno.esquemas'
import { aplicarErroresApi, listarMensajes } from '../../formularios/erroresApi'
import { PanelCatalogoMuebles } from './PanelCatalogoMuebles'
import { PanelConfiguracion, type Pestana } from './PanelConfiguracion'
import { PanelMueblesEnCocina } from './PanelMueblesEnCocina'
import { VistaPrevia3D } from './VistaPrevia3D'

interface Props {
  id?: string
  inicial: EntradaDiseno
  muebles: Mueble[]
  granitos: Granito[]
}

/** Medida usable en la escena aunque el campo esté vacío o a medio escribir. */
const medidaSegura = (valor: number) => (Number.isFinite(valor) ? Math.min(20, Math.max(0.5, valor)) : 3)

export function EditorFormulario({ id, inicial, muebles: catalogoLista, granitos }: Props) {
  const navegar = useNavigate()
  const aviso = useAviso()
  const [pestana, setPestana] = useState<Pestana>('materiales')
  const [pieza, setPieza] = useState('meson')

  // React Hook Form guarda TODO el diseño; la escena 3D lee los mismos valores con useWatch.
  const metodos = useForm<EntradaDiseno>({ resolver: zodResolver(esquemaDiseno), defaultValues: inicial })
  const { control, register, handleSubmit, setValue, setError, reset, formState } = metodos

  const nombre = useWatch({ control, name: 'nombre' })
  const forma = useWatch({ control, name: 'forma' })
  const ancho = useWatch({ control, name: 'medidasM.ancho' })
  const fondo = useWatch({ control, name: 'medidasM.fondo' })
  const mueblesDiseno = useWatch({ control, name: 'muebles' })
  const materiales = useWatch({ control, name: 'materiales' })

  const catalogo = useMemo(() => new Map(catalogoLista.map((m) => [m._id, m])), [catalogoLista])
  const granitosPorId = useMemo(() => new Map(granitos.map((g) => [g._id, g])), [granitos])
  const medidas = useMemo(() => ({ ancho: medidaSegura(ancho), fondo: medidaSegura(fondo) }), [ancho, fondo])
  const resueltos = useMemo<MuebleResuelto[]>(
    () => mueblesDiseno.flatMap((m) => {
      const mueble = catalogo.get(m.mueble)
      return mueble === undefined ? [] : [{ _id: m._id, posicion: m.posicion, mueble }]
    }),
    [mueblesDiseno, catalogo],
  )

  const cambiarMuebles = (valor: EntradaDiseno['muebles']) => setValue('muebles', valor, { shouldDirty: true })

  const quitar = (idMueble: string) => {
    const resultado = quitarMuebleDeDiseno(mueblesDiseno, materiales, idMueble)
    cambiarMuebles(resultado.muebles)
    setValue('materiales', resultado.materiales, { shouldDirty: true })
    if (pieza === `mueble:${idMueble}`) setPieza('meson')
  }

  const guardar = handleSubmit(async (datos) => {
    try {
      const guardado = id === undefined ? await disenosApi.crear(datos) : await disenosApi.reemplazar(id, datos)
      aviso.mostrar('Diseño guardado')
      reset(datos)
      if (id === undefined) navegar(`/disenos/${guardado._id}`, { replace: true })
    } catch (e) {
      const error = aErrorApi(e)
      // 400: los `detalles` se pegan a sus campos (o aparecen en la lista de abajo si no tienen input).
      if (aplicarErroresApi(error, setError) === 0) aviso.mostrar(error.mensaje, 'error')
      else aviso.mostrar('Revisa los campos marcados', 'error')
    }
  })

  const mensajesError = listarMensajes(formState.errors).filter((m) => !m.startsWith('nombre') && !m.startsWith('medidasM'))

  return (
    <FormProvider {...metodos}>
      <Box component="form" onSubmit={guardar} noValidate sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <Paper
          component="header"
          square
          elevation={0}
          sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}
        >
          <TextField
            variant="standard"
            slotProps={{ htmlInput: { 'aria-label': 'Nombre del diseño', style: { fontSize: 18, fontWeight: 600 } } }}
            error={formState.errors.nombre !== undefined}
            helperText={formState.errors.nombre?.message}
            sx={{ flex: '1 1 260px', maxWidth: 340 }}
            {...register('nombre')}
          />
          <Box sx={{ flex: 1 }} />
          <Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => navegar('/disenos/nuevo')}>Nuevo diseño</Button>
        </Paper>

        {mensajesError.length > 0 && (
          <Alert severity="error" sx={{ m: 2, mb: 0 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>{mensajesError.map((m) => <li key={m}>{m}</li>)}</ul>
          </Alert>
        )}

        <Box sx={{ display: 'grid', gap: 2, p: 2, gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr) 360px' }, alignItems: 'start' }}>
          <Box sx={{ order: { xs: 3, lg: 1 } }}>
            <PanelCatalogoMuebles muebles={catalogoLista} onAgregar={(m) => cambiarMuebles(agregarMueble(mueblesDiseno, m._id))} />
          </Box>
          <Box sx={{ order: { xs: 1, lg: 2 } }}>
            <VistaPrevia3D forma={forma} medidas={medidas} muebles={resueltos} materiales={materiales} granitos={granitos} nombreArchivo={nombre} />
          </Box>
          <Box sx={{ order: { xs: 2, lg: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <PanelConfiguracion granitos={granitos} catalogo={catalogo} pestana={pestana} onPestana={setPestana} piezaElegida={pieza} onPieza={setPieza} />
            <PanelMueblesEnCocina
              muebles={mueblesDiseno}
              catalogo={catalogo}
              materiales={materiales}
              granitos={granitosPorId}
              onElegir={(idMueble) => { setPieza(`mueble:${idMueble}`); setPestana('materiales') }}
              onQuitar={quitar}
              onMover={(idMueble, delta) => cambiarMuebles(moverMueble(mueblesDiseno, idMueble, delta))}
            />
          </Box>
        </Box>
      </Box>
    </FormProvider>
  )
}
