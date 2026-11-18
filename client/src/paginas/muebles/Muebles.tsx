import AddIcon from '@mui/icons-material/Add'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo, useState } from 'react'
import { mueblesApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useEsAdmin } from '../../auth/useAuth'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import { ConfirmarDialogo } from '../../componentes/ConfirmarDialogo'
import { EstadoConsulta } from '../../componentes/EstadoConsulta'
import { describirMedidas, ETIQUETA_TIPO_MUEBLE, TIPOS_MUEBLE, type FiltrosMuebles, type Mueble, type TipoMueble } from '../../dominio/mueble'
import { useConsulta } from '../../hooks/useConsulta'
import { useDebounce } from '../../hooks/useDebounce'
import { DialogoMueble } from './DialogoMueble'

export function Muebles() {
  const esAdmin = useEsAdmin()
  const aviso = useAviso()
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<TipoMueble | ''>('')
  const [pagina, setPagina] = useState(1)
  const [dialogo, setDialogo] = useState<{ mueble: Mueble | null } | null>(null)
  const [aInactivar, setAInactivar] = useState<Mueble | null>(null)
  const busquedaRetrasada = useDebounce(busqueda)

  const filtros = useMemo<FiltrosMuebles>(
    () => ({ pagina, limite: 12, busqueda: busquedaRetrasada || undefined, tipo: tipo || undefined }),
    [pagina, busquedaRetrasada, tipo],
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2, mb: 3 }}>
        <Typography component="h1" variant="h1" sx={{ flex: '1 1 240px' }}>Catálogo de muebles</Typography>
        <TextField label="Buscar" type="search" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1) }} sx={{ width: 220 }} />
        <TextField select label="Tipo" value={tipo} onChange={(e) => { setTipo(e.target.value as TipoMueble | ''); setPagina(1) }} sx={{ width: 200 }}>
          <MenuItem value="">Todos</MenuItem>
          {TIPOS_MUEBLE.map((t) => <MenuItem key={t} value={t}>{ETIQUETA_TIPO_MUEBLE[t]}</MenuItem>)}
        </TextField>
        {esAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogo({ mueble: null })}>Nuevo mueble</Button>}
      </Box>

      <EstadoConsulta cargando={consulta.cargando && resultado === undefined} error={consulta.error} onReintentar={consulta.recargar} />
      {resultado !== undefined && resultado.items.length === 0 && <Typography color="text.secondary">No hay muebles que coincidan.</Typography>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2, opacity: consulta.cargando ? 0.6 : 1 }}>
        {resultado?.items.map((m) => (
          <Card key={m._id} component="article">
            <CardContent>
              <Box
                sx={{
                  height: 90, borderRadius: 2, mb: 1.5, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', p: 0.5,
                  background: 'linear-gradient(90deg, #a9805a 0%, #8f6a46 50%, #a9805a 100%)',
                }}
              >
                {esAdmin && (
                  <>
                    <IconButton aria-label={`Editar ${m.nombre}`} onClick={() => setDialogo({ mueble: m })} sx={{ bgcolor: 'rgba(255,255,255,0.88)', mr: 0.5, '&:hover': { bgcolor: '#fff' } }}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton aria-label={`Inactivar ${m.nombre}`} color="error" onClick={() => setAInactivar(m)} sx={{ bgcolor: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: '#fff' } }}>
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Box>
              <Typography component="h2" variant="h3" sx={{ mb: 0.5 }}>{m.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">{ETIQUETA_TIPO_MUEBLE[m.tipo]}</Typography>
              <Typography variant="body2" color="text.secondary">{describirMedidas(m)}</Typography>
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
