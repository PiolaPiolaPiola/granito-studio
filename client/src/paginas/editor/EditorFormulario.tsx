import { zodResolver } from '@hookform/resolvers/zod'
import AddIcon from '@mui/icons-material/Add'
import RequestQuoteOutlined from '@mui/icons-material/RequestQuoteOutlined'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import { useCallback, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { disenosApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import {
  agregarMueble,
  cambiarMedidasPieza,
  moverMueble,
  quitarMuebleDeDiseno,
  ubicarMueble,
  type EntradaDiseno,
} from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import type { Mueble } from '../../dominio/mueble'
import { distribuir, rotacionDe, type MuebleResuelto } from '../../escena/distribucion'
import { esquemaDiseno } from '../../esquemas/diseno.esquemas'
import { aplicarErroresApi, listarMensajes } from '../../formularios/erroresApi'
import { BotonVoz } from '../../voz/BotonVoz'
import { BotonCompartir } from './BotonCompartir'
import { DialogoCotizacion } from './DialogoCotizacion'
import { PanelCatalogoMuebles } from './PanelCatalogoMuebles'
import { PanelConfiguracion, type Pestana } from './PanelConfiguracion'
import { PanelMueblesEnCocina } from './PanelMueblesEnCocina'
import { PanelPieza } from './PanelPieza'
import { VistaPrevia3D } from './VistaPrevia3D'

interface Props {
  id?: string
  inicial: EntradaDiseno
  /** Si el diseño guardado ya está compartido. */
  codigoPublico?: string
  muebles: Mueble[]
  granitos: Granito[]
}

/** Medida usable en la escena aunque el campo esté vacío o a medio escribir. */
const medidaSegura = (valor: number) => (Number.isFinite(valor) ? Math.min(20, Math.max(0.5, valor)) : 3)
const espesorSeguro = (valor: number) => (Number.isFinite(valor) ? Math.min(10, Math.max(1, valor)) : 3)

export function EditorFormulario({ id, inicial, codigoPublico, muebles: catalogoLista, granitos }: Props) {
  const navegar = useNavigate()
  const aviso = useAviso()
  const [pestana, setPestana] = useState<Pestana>('materiales')
  const [pieza, setPieza] = useState('meson')
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const lienzo = useRef<HTMLCanvasElement | null>(null)
  /** Foto del lienzo al abrir la cotización (null = cerrada). */
  const [cotizacion, setCotizacion] = useState<{ imagen: string | null } | null>(null)

  // React Hook Form guarda TODO el diseño; la escena 3D lee los mismos valores con useWatch.
  const metodos = useForm<EntradaDiseno>({ resolver: zodResolver(esquemaDiseno), defaultValues: inicial })
  const { control, register, handleSubmit, setValue, setError, reset, formState } = metodos

  const nombre = useWatch({ control, name: 'nombre' })
  const espacio = useWatch({ control, name: 'espacio' })
  const forma = useWatch({ control, name: 'forma' })
  const ancho = useWatch({ control, name: 'medidasM.ancho' })
  const fondo = useWatch({ control, name: 'medidasM.fondo' })
  const acabadosForm = useWatch({ control, name: 'acabados' })
  const mueblesDiseno = useWatch({ control, name: 'muebles' })
  const materiales = useWatch({ control, name: 'materiales' })

  const catalogo = useMemo(() => new Map(catalogoLista.map((m) => [m._id, m])), [catalogoLista])
  const granitosPorId = useMemo(() => new Map(granitos.map((g) => [g._id, g])), [granitos])
  const medidas = useMemo(() => ({ ancho: medidaSegura(ancho), fondo: medidaSegura(fondo) }), [ancho, fondo])
  const acabados = useMemo(
    () => ({ ...acabadosForm, espesorCm: espesorSeguro(acabadosForm.espesorCm) }),
    [acabadosForm],
  )
  const resueltos = useMemo<MuebleResuelto[]>(
    () => mueblesDiseno.flatMap((m) => {
      const mueble = catalogo.get(m.mueble)
      return mueble === undefined ? [] : [{ _id: m._id, posicion: m.posicion, mueble, medidasCm: m.medidasCm, ubicacion: m.ubicacion }]
    }),
    [mueblesDiseno, catalogo],
  )
  const { colocaciones, desbordados } = useMemo(() => distribuir(forma, medidas, resueltos), [forma, medidas, resueltos])

  const cambiarMuebles = useCallback(
    (valor: EntradaDiseno['muebles']) => setValue('muebles', valor, { shouldDirty: true }),
    [setValue],
  )

  /** Arrastre en la forma libre: conserva el giro que ya tenía la pieza. */
  const moverEnEscena = useCallback(
    (idMueble: string, x: number, z: number) => {
      const actuales = metodos.getValues('muebles')
      const pieza = actuales.find((m) => m._id === idMueble)
      const colocada = colocaciones.find((c) => c.id === idMueble)
      const rotacion = pieza?.ubicacion?.rotacion ?? (colocada === undefined ? 0 : rotacionDe(colocada.rotY))
      cambiarMuebles(ubicarMueble(actuales, idMueble, { x, z, rotacion }, medidas))
    },
    [metodos, colocaciones, cambiarMuebles, medidas],
  )

  const quitar = (idMueble: string) => {
    const resultado = quitarMuebleDeDiseno(mueblesDiseno, materiales, idMueble)
    cambiarMuebles(resultado.muebles)
    setValue('materiales', resultado.materiales, { shouldDirty: true })
    if (pieza === `mueble:${idMueble}`) setPieza('meson')
    if (seleccionado === idMueble) setSeleccionado(null)
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

  const mensajesError = listarMensajes(formState.errors).filter((m) => !m.startsWith('nombre') && !m.startsWith('medidasM') && !m.startsWith('acabados'))
  const piezaSeleccionada = mueblesDiseno.find((m) => m._id === seleccionado)
  const muebleSeleccionado = piezaSeleccionada === undefined ? undefined : catalogo.get(piezaSeleccionada.mueble)

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
          <BotonVoz
            obtenerDiseno={() => metodos.getValues()}
            catalogo={catalogoLista}
            granitos={granitos}
            onAplicar={(nuevo) => {
              const opciones = { shouldDirty: true }
              setValue('espacio', nuevo.espacio, opciones)
              setValue('forma', nuevo.forma, opciones)
              setValue('medidasM', nuevo.medidasM, opciones)
              setValue('acabados', nuevo.acabados, opciones)
              setValue('muebles', nuevo.muebles, opciones)
              setValue('materiales', nuevo.materiales, opciones)
            }}
          />
          {id !== undefined && <BotonCompartir idDiseno={id} codigoInicial={codigoPublico} />}
          <Button
            variant="outlined"
            startIcon={<RequestQuoteOutlined />}
            onClick={() => setCotizacion({ imagen: lienzo.current?.toDataURL('image/png') ?? null })}
          >
            Cotización
          </Button>
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
            <PanelCatalogoMuebles
              muebles={catalogoLista}
              espacio={espacio}
              onAgregar={(m) => cambiarMuebles(agregarMueble(mueblesDiseno, m._id))}
            />
          </Box>
          <Box sx={{ order: { xs: 1, lg: 2 } }}>
            <VistaPrevia3D
              forma={forma}
              medidas={medidas}
              acabados={acabados}
              colocaciones={colocaciones}
              desbordados={desbordados}
              materiales={materiales}
              granitos={granitos}
              nombreArchivo={nombre}
              seleccionado={seleccionado}
              onSeleccionar={setSeleccionado}
              onMover={moverEnEscena}
              onLienzo={(l) => { lienzo.current = l }}
            />
          </Box>
          <Box sx={{ order: { xs: 2, lg: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {piezaSeleccionada !== undefined && muebleSeleccionado !== undefined && (
              <PanelPieza
                key={piezaSeleccionada._id}
                pieza={piezaSeleccionada}
                mueble={muebleSeleccionado}
                colocacion={colocaciones.find((c) => c.id === piezaSeleccionada._id)}
                forma={forma}
                onMedidas={(m) => cambiarMuebles(cambiarMedidasPieza(mueblesDiseno, piezaSeleccionada._id, m))}
                onUbicar={(u) => cambiarMuebles(ubicarMueble(mueblesDiseno, piezaSeleccionada._id, u, medidas))}
                onMaterial={() => { setPieza(`mueble:${piezaSeleccionada._id}`); setPestana('materiales') }}
                onCerrar={() => setSeleccionado(null)}
              />
            )}
            <PanelConfiguracion granitos={granitos} catalogo={catalogo} pestana={pestana} onPestana={setPestana} piezaElegida={pieza} onPieza={setPieza} />
            <PanelMueblesEnCocina
              muebles={mueblesDiseno}
              catalogo={catalogo}
              materiales={materiales}
              granitos={granitosPorId}
              seleccionado={seleccionado}
              onElegir={(idMueble) => { setSeleccionado(idMueble); setPieza(`mueble:${idMueble}`) }}
              onQuitar={quitar}
              onMover={(idMueble, delta) => cambiarMuebles(moverMueble(mueblesDiseno, idMueble, delta))}
            />
          </Box>
        </Box>
      </Box>
      <DialogoCotizacion
        abierto={cotizacion !== null}
        onCerrar={() => setCotizacion(null)}
        imagen={cotizacion?.imagen ?? null}
        nombre={nombre}
        espacio={espacio}
        forma={forma}
        medidas={medidas}
        acabados={acabados}
        colocaciones={colocaciones}
        materiales={materiales}
        granitosPorId={granitosPorId}
      />
    </FormProvider>
  )
}
