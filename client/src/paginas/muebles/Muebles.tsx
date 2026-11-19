import AddIcon from '@mui/icons-material/Add'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo, useState } from 'react'
import { mueblesApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useEsAdmin } from '../../auth/useAuth'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import { ConfirmarDialogo } from '../../componentes/ConfirmarDialogo'
import { EstadoConsulta } from '../../componentes/EstadoConsulta'
import { MiniaturaMueble } from '../../componentes/MiniaturaMueble'
import {
  describirMedidas,
  espacioDe,
  ESPACIOS,
  ETIQUETA_ESPACIO,
  ETIQUETA_MATERIAL,
  ETIQUETA_TIPO_MUEBLE,
  MATERIALES_MUEBLE,
  materialDe,
  TIPOS_POR_ESPACIO,
  type Espacio,
  type FiltrosMuebles,
  type MaterialMueble,
  type Mueble,
  type TipoMueble,
} from '../../dominio/mueble'
import { useConsulta } from '../../hooks/useConsulta'
import { useDebounce } from '../../hooks/useDebounce'
import { DialogoMueble } from './DialogoMueble'

export function Muebles() {
  const esAdmin = useEsAdmin()
  const aviso = useAviso()
  const [busqueda, setBusqueda] = useState('')
  const [espacio, setEspacio] = useState<Espacio>('cocina')
  const [tipo, setTipo] = useState<TipoMueble | ''>('')
  const [material, setMaterial] = useState<MaterialMueble | ''>('')
  const [pagina, setPagina] = useState(1)
  const [dialogo, setDialogo] = useState<{ mueble: Mueble | null } | null>(null)
  const [aInactivar, setAInactivar] = useState<Mueble | null>(null)
  const busquedaRetrasada = useDebounce(busqueda)

  const filtros = useMemo<FiltrosMuebles>(
    () => ({
      pagina,
      limite: 12,
      espacio,
      busqueda: busquedaRetrasada || undefined,
      tipo: tipo || undefined,
      material: material || undefined,
    }),
    [pagina, espacio, busquedaRetrasada, tipo, material],
  )
  const consulta = useConsulta(useCallback(() => mueblesApi.listar(filtros), [filtros]))
  const resultado = consulta.datos

  const inactivar = async () => {
    if (aInactivar === null) return
    try {
      await mueblesApi.desactivar(aInactivar._id)
      aviso.mostrar('Mueble inactivado')
      setAInactivar(null)
      consulta.recargar()
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2, mb: 2 }}>
        <Typography component="h1" variant="h1" sx={{ flex: '1 1 240px' }}>Catálogo de muebles</Typography>
        <TextField label="Buscar" type="search" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }} sx={{ width: 200 }} />
        <TextField select label="Tipo" value={tipo} onChange={(e) => { setTipo(e.target.value as TipoMueble | ''); setPagina(1) }} sx={{ width: 200 }}>
          <MenuItem value="">Todos</MenuItem>
          {TIPOS_POR_ESPACIO[espacio].map((t) => <MenuItem key={t} value={t}>{ETIQUETA_TIPO_MUEBLE[t]}</MenuItem>)}
        </TextField>
        <TextField select label="Material" value={material} onChange={(e) => { setMaterial(e.target.value as MaterialMueble | ''); setPagina(1) }} sx={{ width: 150 }}>
          <MenuItem value="">Todos</MenuItem>
          {MATERIALES_MUEBLE.map((m) => <MenuItem key={m} value={m}>{ETIQUETA_MATERIAL[m]}</MenuItem>)}
        </TextField>
        {esAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogo({ mueble: null })}>Nuevo mueble</Button>}
      </Box>

      <Tabs
        value={espacio}
        onChange={(_, v: Espacio) => { setEspacio(v); setTipo(''); setPagina(1) }}
        aria-label="Espacio"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {ESPACIOS.map((e) => <Tab key={e} value={e} label={ETIQUETA_ESPACIO[e]} />)}
      </Tabs>

      <EstadoConsulta cargando={consulta.cargando && resultado === undefined} error={consulta.error} onReintentar={consulta.recargar} />
      {resultado !== undefined && resultado.items.length === 0 && <Typography color="text.secondary">No hay muebles que coincidan.</Typography>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2, opacity: consulta.cargando ? 0.6 : 1 }}>
        {resultado?.items.map((m) => (
          <Card key={m._id} component="article">
            <Box sx={{ position: 'relative' }}>
              <MiniaturaMueble mueble={m} sx={{ height: 140 }} />
              {esAdmin && (
                <Box sx={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', gap: 0.5 }}>
                  <IconButton aria-label={`Editar ${m.nombre}`} onClick={() => setDialogo({ mueble: m })} sx={{ bgcolor: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: '#fff' } }}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton aria-label={`Inactivar ${m.nombre}`} color="error" onClick={() => setAInactivar(m)} sx={{ bgcolor: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: '#fff' } }}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
            <CardContent>
              <Typography component="h2" variant="h3" sx={{ mb: 0.5 }}>{m.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">{ETIQUETA_TIPO_MUEBLE[m.tipo]} · {describirMedidas(m)}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                <Chip size="small" label={ETIQUETA_ESPACIO[espacioDe(m)]} />
                <Chip size="small" variant="outlined" label={ETIQUETA_MATERIAL[materialDe(m)]} />
                {m.imagenUrl !== undefined && <Chip size="small" variant="outlined" label="Con foto" />}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {resultado !== undefined && resultado.totalPaginas > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={resultado.totalPaginas} page={resultado.pagina} onChange={(_, p) => setPagina(p)} color="primary" />
        </Box>
      )}

      <DialogoMueble
        abierto={dialogo !== null}
        mueble={dialogo?.mueble ?? null}
        espacioInicial={espacio}
        onCerrar={() => setDialogo(null)}
        onGuardado={() => { setDialogo(null); consulta.recargar() }}
      />
      <ConfirmarDialogo
        abierto={aInactivar !== null}
        titulo="Inactivar mueble"
        mensaje={`«${aInactivar?.nombre ?? ''}» dejará de aparecer en el catálogo.`}
        textoConfirmar="Inactivar"
        onConfirmar={inactivar}
        onCancelar={() => setAInactivar(null)}
      />
    </Box>
  )
}
