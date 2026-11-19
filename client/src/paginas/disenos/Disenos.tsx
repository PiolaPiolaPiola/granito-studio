import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { useCallback, useState } from 'react'
import { Link as EnlaceRouter } from 'react-router'
import { disenosApi } from '../../api'
import { aErrorApi } from '../../api/errores'
import { useAviso } from '../../componentes/aviso/AvisoContext'
import { ConfirmarDialogo } from '../../componentes/ConfirmarDialogo'
import { EstadoConsulta } from '../../componentes/EstadoConsulta'
import { ETIQUETA_FORMA, type Diseno } from '../../dominio/diseno'
import { ETIQUETA_ESPACIO } from '../../dominio/mueble'
import { useConsulta } from '../../hooks/useConsulta'

const FONDO_FORMA: Record<Diseno['forma'], string> = {
  lineal: 'linear-gradient(135deg, #d6d0c3 0%, #b3ab9c 100%)',
  L: 'linear-gradient(135deg, #cfc8ba 0%, #a89f91 100%)',
  U: 'linear-gradient(135deg, #cbc4b6 0%, #9d9486 100%)',
  isla: 'linear-gradient(135deg, #d2ccbf 0%, #8f8578 100%)',
  libre: 'linear-gradient(135deg, #d9d3c8 0%, #b9ae9d 100%)',
}

export function Disenos() {
  const aviso = useAviso()
  const consulta = useConsulta(useCallback(() => disenosApi.listar(), []))
  const [aEliminar, setAEliminar] = useState<Diseno | null>(null)
  const disenos = consulta.datos

  const duplicar = async (d: Diseno) => {
    try {
      await disenosApi.duplicar(d._id)
      aviso.mostrar('Diseño duplicado')
      consulta.recargar()
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    }
  }

  const eliminar = async () => {
    if (aEliminar === null) return
    try {
      await disenosApi.eliminar(aEliminar._id)
      aviso.mostrar('Diseño eliminado')
      setAEliminar(null)
      consulta.recargar()
    } catch (e) {
      aviso.mostrar(aErrorApi(e).mensaje, 'error')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography component="h1" variant="h1" sx={{ flex: '1 1 240px' }}>Diseños guardados</Typography>
        <Button component={EnlaceRouter} to="/disenos/nuevo" variant="contained">Crear diseño</Button>
      </Box>

      <EstadoConsulta cargando={consulta.cargando && disenos === undefined} error={consulta.error} onReintentar={consulta.recargar} />
      {disenos?.length === 0 && <Typography color="text.secondary">Aún no hay diseños. Crea el primero.</Typography>}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
        {disenos?.map((d) => (
          <Card key={d._id} component="article" sx={{ overflow: 'hidden' }}>
            <Box sx={{ height: 130, display: 'grid', placeItems: 'center', background: FONDO_FORMA[d.forma] }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'rgba(38,35,32,0.7)', textAlign: 'center' }}>
                {ETIQUETA_ESPACIO[d.espacio ?? 'cocina']}
                <br />
                <Box component="span" sx={{ fontSize: 15, fontWeight: 500 }}>{ETIQUETA_FORMA[d.forma]}</Box>
              </Typography>
            </Box>
            <CardContent>
              <Typography component="h2" variant="h3" noWrap>{d.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">
                {dayjs(d.updatedAt).locale('es').format('D [de] MMMM [de] YYYY')} · {d.muebles.length} muebles
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                <IconButton component={EnlaceRouter} to={`/disenos/${d._id}`} aria-label={`Abrir ${d.nombre} en el editor`}><FolderOpenOutlined /></IconButton>
                <IconButton aria-label={`Duplicar ${d.nombre}`} onClick={() => duplicar(d)}><ContentCopyOutlined /></IconButton>
                <IconButton aria-label={`Eliminar ${d.nombre}`} color="error" onClick={() => setAEliminar(d)}><DeleteOutlined /></IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <ConfirmarDialogo
        abierto={aEliminar !== null}
        titulo="Eliminar diseño"
        mensaje={`¿Seguro que deseas eliminar «${aEliminar?.nombre ?? ''}»? Esta acción no se puede deshacer.`}
        onConfirmar={eliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </Box>
  )
}
