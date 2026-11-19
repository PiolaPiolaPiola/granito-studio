import AddIcon from '@mui/icons-material/Add'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo, useState } from 'react'
import { granitosApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useEsAdmin } from '../../auth/useAuth'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import { ConfirmarDialogo } from '../../componentes/ConfirmarDialogo'
import { EstadoConsulta } from '../../componentes/EstadoConsulta'
import { MuestraGranito } from '../../componentes/MuestraGranito'
import { pesos } from '../../dominio/cotizacion'
import {
  ACABADOS,
  ETIQUETA_ACABADO,
  ETIQUETA_TIPO_PIEDRA,
  TIPOS_PIEDRA,
  type Acabado,
  type FiltrosGranitos,
  type Granito,
  type TipoPiedra,
} from '../../dominio/granito'
import { useConsulta } from '../../hooks/useConsulta'
import { useDebounce } from '../../hooks/useDebounce'
import { DialogoGranito } from './DialogoGranito'

const POR_PAGINA = 12

export function Granitos() {
  const esAdmin = useEsAdmin()
  const aviso = useAviso()
  const [busqueda, setBusqueda] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [tipo, setTipo] = useState<TipoPiedra | ''>('')
  const [acabado, setAcabado] = useState<Acabado | ''>('')
  const [pagina, setPagina] = useState(1)
  const [dialogo, setDialogo] = useState<{ granito: Granito | null } | null>(null)
  const [aInactivar, setAInactivar] = useState<Granito | null>(null)

  const busquedaRetrasada = useDebounce(busqueda)
  const etiquetaRetrasada = useDebounce(etiqueta)

  const filtros = useMemo<FiltrosGranitos>(
    () => ({
      pagina,
      limite: POR_PAGINA,
      busqueda: busquedaRetrasada || undefined,
      etiqueta: etiquetaRetrasada || undefined,
      tipo: tipo || undefined,
      acabado: acabado || undefined,
    }),
    [pagina, busquedaRetrasada, etiquetaRetrasada, tipo, acabado],
  )
  const consulta = useConsulta(useCallback(() => granitosApi.listar(filtros), [filtros]))
  const resultado = consulta.datos

  // Cambiar un filtro vuelve a la primera página.
  const alFiltrar = <T,>(poner: (v: T) => void) => (v: T) => {
    poner(v)
    setPagina(1)
  }

  const inactivar = async () => {
    if (aInactivar === null) return
    try {
      await granitosApi.desactivar(aInactivar._id)
      aviso.mostrar('Granito inactivado')
      setAInactivar(null)
      consulta.recargar()
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2, mb: 3 }}>
        <Typography component="h1" variant="h1" sx={{ flex: '1 1 240px' }}>
          Catálogo de granitos
        </Typography>
        <TextField label="Buscar" type="search" placeholder="Nombre o etiqueta" value={busqueda} onChange={(e) => alFiltrar(setBusqueda)(e.target.value)} sx={{ width: 220 }} />
        <TextField label="Etiqueta" value={etiqueta} onChange={(e) => alFiltrar(setEtiqueta)(e.target.value)} sx={{ width: 140 }} />
        <TextField select label="Tipo" value={tipo} onChange={(e) => alFiltrar(setTipo)(e.target.value as TipoPiedra | '')} sx={{ width: 140 }}>
          <MenuItem value="">Todos</MenuItem>
          {TIPOS_PIEDRA.map((t) => <MenuItem key={t} value={t}>{ETIQUETA_TIPO_PIEDRA[t]}</MenuItem>)}
        </TextField>
        <TextField select label="Acabado" value={acabado} onChange={(e) => alFiltrar(setAcabado)(e.target.value as Acabado | '')} sx={{ width: 140 }}>
          <MenuItem value="">Todos</MenuItem>
          {ACABADOS.map((a) => <MenuItem key={a} value={a}>{ETIQUETA_ACABADO[a]}</MenuItem>)}
        </TextField>
        {esAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogo({ granito: null })}>
            Subir granito
          </Button>
        )}
      </Box>

      <EstadoConsulta cargando={consulta.cargando && resultado === undefined} error={consulta.error} onReintentar={consulta.recargar} />
      {resultado !== undefined && resultado.items.length === 0 && (
        <Typography color="text.secondary">No hay granitos que coincidan con la búsqueda.</Typography>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 2, opacity: consulta.cargando ? 0.6 : 1 }}>
        {resultado?.items.map((g) => (
          <Card key={g._id} component="article">
            <CardContent>
              {g.fotoUrl === undefined ? (
                <MuestraGranito imagenUrl={g.imagenUrl} alt={`Textura de ${g.nombre}`} sx={{ aspectRatio: '4 / 3', borderRadius: 2, mb: 1.5 }} />
              ) : (
                // Foto de un trabajo real del taller, con la textura 3D en una esquina.
                <Box sx={{ position: 'relative', mb: 1.5 }}>
                  <Box
                    component="img"
                    src={g.fotoUrl}
                    alt={`Trabajo real en ${g.nombre}`}
                    loading="lazy"
                    sx={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 2 }}
                  />
                  <MuestraGranito
                    imagenUrl={g.imagenUrl}
                    alt={`Textura de ${g.nombre}`}
                    sx={{ position: 'absolute', right: 8, bottom: 8, width: 44, height: 44, borderRadius: '50%', border: '2px solid #fff', boxShadow: 2 }}
                  />
                </Box>
              )}
              <Typography component="h2" variant="h3" sx={{ mb: 1 }}>{g.nombre}</Typography>
              {g.precioM2 !== undefined && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{pesos(g.precioM2)} por m²</Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                <Chip size="small" label={ETIQUETA_TIPO_PIEDRA[g.tipo]} sx={{ bgcolor: '#EFEAE2' }} />
                <Chip size="small" variant="outlined" label={ETIQUETA_ACABADO[g.acabado]} />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {g.etiquetas.map((e) => <Chip key={e} size="small" variant="outlined" label={e} />)}
              </Box>
            </CardContent>
            {esAdmin && (
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton aria-label={`Editar ${g.nombre}`} onClick={() => setDialogo({ granito: g })}><EditOutlined /></IconButton>
                <IconButton aria-label={`Inactivar ${g.nombre}`} color="error" onClick={() => setAInactivar(g)}><DeleteOutlined /></IconButton>
              </CardActions>
            )}
          </Card>
        ))}
      </Box>

      {resultado !== undefined && resultado.totalPaginas > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={resultado.totalPaginas} page={resultado.pagina} onChange={(_, p) => setPagina(p)} color="primary" />
        </Box>
      )}

      <DialogoGranito
        abierto={dialogo !== null}
        granito={dialogo?.granito ?? null}
        onCerrar={() => setDialogo(null)}
        onGuardado={() => {
          setDialogo(null)
          consulta.recargar()
        }}
      />
      <ConfirmarDialogo
        abierto={aInactivar !== null}
        titulo="Inactivar granito"
        mensaje={`«${aInactivar?.nombre ?? ''}» dejará de aparecer en el catálogo. Los diseños que ya lo usan no se borran.`}
        textoConfirmar="Inactivar"
        onConfirmar={inactivar}
        onCancelar={() => setAInactivar(null)}
      />
    </Box>
  )
}
