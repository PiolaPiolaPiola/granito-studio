import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo, useState } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { sugerenciasApi } from '../../api'
import { EstadoConsulta } from '../../componentes/EstadoConsulta'
import { MuestraGranito } from '../../componentes/MuestraGranito'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import { SelectorColor } from '../../componentes/SelectorColor'
import {
  asignarMaterial,
  buscarMaterial,
  ETIQUETA_FORMA,
  ETIQUETA_SALPICADERO,
  FORMAS_COCINA,
  quitarMaterial,
  SALPICADEROS,
  type EntradaDiseno,
  type MaterialAsignado,
  type Pieza,
} from '../../dominio/diseno'
import { ETIQUETA_TIPO_PIEDRA, TIPOS_PIEDRA, type Granito, type TipoPiedra } from '../../dominio/granito'
import { ESPACIOS, ETIQUETA_ESPACIO, type Espacio, type Mueble } from '../../dominio/mueble'
import { PALETA_MUEBLES, PALETA_PAREDES, PALETA_PIEDRAS, PALETA_PISOS, PALETA_TECHOS } from '../../dominio/paleta'
import type { Sugerencia } from '../../dominio/sugerencia'
import { useConsulta } from '../../hooks/useConsulta'

export type Pestana = 'forma' | 'materiales' | 'sugerencias'

interface Props {
  granitos: Granito[]
  catalogo: Map<string, Mueble>
  pestana: Pestana
  onPestana: (p: Pestana) => void
  /** "meson" | "salpicadero" | "mueble:<idMuebleEnDiseno>" */
  piezaElegida: string
  onPieza: (clave: string) => void
}

export function PanelConfiguracion(props: Props) {
  const { pestana, onPestana } = props
  return (
    <Box component="section" aria-label="Configuración del diseño" sx={{ borderTop: 1, borderColor: 'divider' }}>
      <Tabs value={pestana} onChange={(_, v: Pestana) => onPestana(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="forma" label="Forma" sx={{ minHeight: 48 }} />
        <Tab value="materiales" label="Materiales" sx={{ minHeight: 48 }} />
        <Tab value="sugerencias" label="Sugerencias" sx={{ minHeight: 48 }} />
      </Tabs>
      <Box sx={{ p: 2 }}>
        {pestana === 'forma' && <TabForma />}
        {pestana === 'materiales' && <TabMateriales {...props} />}
        {pestana === 'sugerencias' && <TabSugerencias {...props} />}
      </Box>
    </Box>
  )
}

function TabForma() {
  const { control, register, formState: { errors } } = useFormContext<EntradaDiseno>()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Controller
        control={control}
        name="espacio"
        render={({ field }) => (
          <ToggleButtonGroup exclusive fullWidth value={field.value} onChange={(_, v: Espacio | null) => v !== null && field.onChange(v)} aria-label="Espacio">
            {ESPACIOS.map((e) => (
              <ToggleButton key={e} value={e} sx={{ minHeight: 44, '&.Mui-selected': { bgcolor: 'rgba(143,112,66,0.16)', color: 'primary.dark' } }}>
                {ETIQUETA_ESPACIO[e]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      />
      <Controller
        control={control}
        name="forma"
        render={({ field }) => (
          <ToggleButtonGroup exclusive fullWidth value={field.value} onChange={(_, v: EntradaDiseno['forma'] | null) => v !== null && field.onChange(v)} aria-label="Forma del espacio" sx={{ flexWrap: 'wrap' }}>
            {FORMAS_COCINA.map((f) => (
              <ToggleButton key={f} value={f} sx={{ minHeight: 44, '&.Mui-selected': { bgcolor: 'rgba(143,112,66,0.16)', color: 'primary.dark' } }}>
                {ETIQUETA_FORMA[f]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField label="Ancho (m)" type="number" slotProps={{ htmlInput: { step: 0.1, min: 0.5, max: 20 } }} error={errors.medidasM?.ancho !== undefined} helperText={errors.medidasM?.ancho?.message} {...register('medidasM.ancho', { valueAsNumber: true })} />
        <TextField label="Fondo (m)" type="number" slotProps={{ htmlInput: { step: 0.1, min: 0.5, max: 20 } }} error={errors.medidasM?.fondo !== undefined} helperText={errors.medidasM?.fondo?.message} {...register('medidasM.fondo', { valueAsNumber: true })} />
      </Box>
      <Typography variant="caption" color="text.secondary">
        En <strong>Libre</strong> no hay plantilla: arrastra cada mueble en la vista 3D.
      </Typography>

      <ResumenMeson />
      <ResumenColores />
    </Box>
  )
}

/** Fila compacta con un resumen y un botón que abre un modal (ahorra espacio vertical). */
function FilaResumen({ titulo, children, onCambiar }: { titulo: string; children: React.ReactNode; onCambiar: () => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25, borderRadius: 2, bgcolor: 'suave' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{titulo}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', color: 'text.secondary', fontSize: 13 }}>{children}</Box>
      </Box>
      <Button size="small" variant="outlined" onClick={onCambiar}>Cambiar</Button>
    </Box>
  )
}

function ResumenMeson() {
  const { control, register, formState: { errors } } = useFormContext<EntradaDiseno>()
  const acabados = useWatch({ control, name: 'acabados' })
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <FilaResumen titulo="Mesón" onCambiar={() => setAbierto(true)}>
        {acabados.espesorCm} cm · {ETIQUETA_SALPICADERO[acabados.salpicadero].toLowerCase()}
        {acabados.cascada ? ' · con cascada' : ''}
      </FilaResumen>
      <Dialog open={abierto} onClose={() => setAbierto(false)} fullWidth maxWidth="xs">
        <DialogTitle>Mesón</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Espesor (cm)"
            type="number"
            slotProps={{ htmlInput: { step: 0.5, min: 1, max: 10 } }}
            error={errors.acabados?.espesorCm !== undefined}
            helperText={errors.acabados?.espesorCm?.message}
            {...register('acabados.espesorCm', { valueAsNumber: true })}
          />
          <Controller
            control={control}
            name="acabados.salpicadero"
            render={({ field }) => (
              <TextField select label="Salpicadero" {...field}>
                {SALPICADEROS.map((s) => <MenuItem key={s} value={s}>{ETIQUETA_SALPICADERO[s]}</MenuItem>)}
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="acabados.cascada"
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label="Caída en cascada en islas y barras (la piedra baja hasta el piso)"
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setAbierto(false)}>Listo</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const CAMPOS_ENTORNO = [
  ['entorno.pared', 'Pared', PALETA_PAREDES],
  ['entorno.piso', 'Piso', PALETA_PISOS],
  ['entorno.techo', 'Techo', PALETA_TECHOS],
] as const

function ResumenColores() {
  const { control } = useFormContext<EntradaDiseno>()
  const entorno = useWatch({ control, name: 'entorno' })
  const [abierto, setAbierto] = useState(false)
  const muestra = (hex: string, nombre: string) => (
    <Box component="span" title={nombre} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Box component="span" sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: hex, border: 1, borderColor: 'divider' }} />
      {nombre}
    </Box>
  )
  return (
    <>
      <FilaResumen titulo="Colores del espacio" onCambiar={() => setAbierto(true)}>
        {muestra(entorno.pared, 'pared')}
        {muestra(entorno.piso, 'piso')}
        {muestra(entorno.techo, 'techo')}
      </FilaResumen>
      <Dialog open={abierto} onClose={() => setAbierto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Colores del espacio</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Para ver si los muebles y la piedra combinan con el entorno. Los cambios se ven al instante en el 3D.
          </Typography>
          {CAMPOS_ENTORNO.map(([campo, etiqueta, paleta]) => (
            <Controller
              key={campo}
              control={control}
              name={campo}
              render={({ field }) => <SelectorColor etiqueta={etiqueta} paleta={paleta} valor={field.value} onCambiar={field.onChange} />}
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setAbierto(false)}>Listo</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function interpretarPieza(clave: string): { pieza: Pieza; muebleEnDiseno?: string } {
  if (clave.startsWith('mueble:')) return { pieza: 'mueble', muebleEnDiseno: clave.slice('mueble:'.length) }
  return { pieza: clave === 'salpicadero' ? 'salpicadero' : 'meson' }
}

function TabMateriales({ granitos, catalogo, piezaElegida, onPieza }: Props) {
  const { setValue, control } = useFormContext<EntradaDiseno>()
  const muebles = useWatch({ control, name: 'muebles' })
  const materiales = useWatch({ control, name: 'materiales' })
  const [tipo, setTipo] = useState<TipoPiedra | ''>('')
  const [etiqueta, setEtiqueta] = useState('')
  const [colorLiso, setColorLiso] = useState('#f4f1ea')

  const { pieza, muebleEnDiseno } = interpretarPieza(piezaElegida)
  const paleta = pieza === 'mueble' ? PALETA_MUEBLES : PALETA_PIEDRAS
  const actual = buscarMaterial(materiales, pieza, muebleEnDiseno)

  const etiquetas = useMemo(() => [...new Set(granitos.flatMap((g) => g.etiquetas))].sort(), [granitos])
  const visibles = granitos.filter((g) => (tipo === '' || g.tipo === tipo) && (etiqueta === '' || g.etiquetas.includes(etiqueta)))

  const cambiar = (nuevos: MaterialAsignado[]) => setValue('materiales', nuevos, { shouldDirty: true })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField select label="Pieza" value={piezaElegida} onChange={(e) => onPieza(e.target.value)}>
        <MenuItem value="meson">Mesón</MenuItem>
        <MenuItem value="salpicadero">Salpicadero</MenuItem>
        {[...muebles].sort((a, b) => a.posicion - b.posicion).map((m) => (
          <MenuItem key={m._id} value={`mueble:${m._id}`}>{m.posicion}. {catalogo.get(m.mueble)?.nombre ?? 'Mueble'}</MenuItem>
        ))}
      </TextField>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoPiedra | '')}>
          <MenuItem value="">Todos</MenuItem>
          {TIPOS_PIEDRA.map((t) => <MenuItem key={t} value={t}>{ETIQUETA_TIPO_PIEDRA[t]}</MenuItem>)}
        </TextField>
        <TextField select label="Color / estilo" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)}>
          <MenuItem value="">Todas</MenuItem>
          {etiquetas.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
        </TextField>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5, maxHeight: 300, overflowY: 'auto', pr: 0.5 }}>
        {visibles.map((g) => {
          const activo = actual?.granito === g._id
          return (
            <ButtonBase
              key={g._id}
              aria-pressed={activo}
              onClick={() => cambiar(asignarMaterial(materiales, pieza, muebleEnDiseno, { granito: g._id }))}
              sx={{ flexDirection: 'column', gap: 0.5, p: 0.5, borderRadius: 2, minWidth: 0 }}
            >
              <MuestraGranito
                imagenUrl={g.imagenUrl}
                sx={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '50%', ...(activo ? { border: 3, borderColor: 'primary.main', outline: '2px solid rgba(143,112,66,0.35)', outlineOffset: 2 } : {}) }}
              />
              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '100%' }}>{g.nombre}</Typography>
            </ButtonBase>
          )
        })}
      </Box>
      {visibles.length === 0 && <Typography variant="body2" color="text.secondary">Ningún granito coincide con el filtro.</Typography>}

      <SelectorColor
        etiqueta={pieza === 'mueble' ? 'Color del mueble' : 'Color liso'}
        paleta={paleta}
        valor={colorLiso}
        onCambiar={(hex) => {
          setColorLiso(hex)
          cambiar(asignarMaterial(materiales, pieza, muebleEnDiseno, { colorHex: hex }))
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          {pieza === 'mueble' ? 'Sin material asignado, el mueble usa su foto o el color del catálogo.' : 'Toca un color para aplicarlo.'}
        </Typography>
        <Button color="inherit" disabled={actual === undefined} onClick={() => cambiar(quitarMaterial(materiales, pieza, muebleEnDiseno))}>Quitar</Button>
      </Box>
    </Box>
  )
}

function TabSugerencias({ granitos }: Props) {
  const { setValue, control } = useFormContext<EntradaDiseno>()
  const forma = useWatch({ control, name: 'forma' })
  const espacio = useWatch({ control, name: 'espacio' })
  const muebles = useWatch({ control, name: 'muebles' })
  const materiales = useWatch({ control, name: 'materiales' })
  const granitoActualId = buscarMaterial(materiales, 'meson')?.granito

  const consulta = useConsulta(
    useCallback(() => sugerenciasApi.sugerir({ forma, espacio, granitoActualId }), [forma, espacio, granitoActualId]),
  )

  const aplicar = (s: Sugerencia) => {
    let nuevos = asignarMaterial(materiales, 'meson', undefined, { granito: s.granitoId })
    nuevos = asignarMaterial(nuevos, 'salpicadero', undefined, { granito: s.granitoId })
    for (const m of muebles) nuevos = asignarMaterial(nuevos, 'mueble', m._id, { colorHex: s.colorMueblesHex })
    setValue('materiales', nuevos, { shouldDirty: true })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <EstadoConsulta cargando={consulta.cargando && consulta.datos === undefined} error={consulta.error} onReintentar={consulta.recargar} />
      {consulta.datos?.map((s) => {
        const granito = granitos.find((g) => g._id === s.granitoId)
        return (
          <Paper key={s.granitoId} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mb: 0.5 }}>
              <AutoAwesomeOutlined fontSize="small" />
              <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{s.titulo}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{s.descripcion}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="caption" sx={{ px: 1.25, py: 0.25, borderRadius: 3, bgcolor: 'action.selected' }}>{s.estilo}</Typography>
              {granito && <MuestraGranito imagenUrl={granito.imagenUrl} sx={{ width: 20, height: 20, borderRadius: '50%' }} />}
              <Box aria-hidden="true" sx={{ width: 20, height: 20, borderRadius: '50%', border: 1, borderColor: 'divider', bgcolor: s.colorMueblesHex }} />
            </Box>
            <Button size="small" variant="contained" startIcon={<CheckCircleOutlined />} onClick={() => aplicar(s)}>Aplicar</Button>
          </Paper>
        )
      })}
    </Box>
  )
}
