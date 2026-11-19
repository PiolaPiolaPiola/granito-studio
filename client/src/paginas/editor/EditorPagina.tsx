import Box from '@mui/material/Box'
import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router'
import { disenosApi, granitosApi, mueblesApi } from '../../api'
import { EstadoConsulta } from '../../componentes/EstadoConsulta'
import { aEntrada, disenoVacio } from '../../dominio/diseno'
import { useConsulta } from '../../hooks/useConsulta'
import { EditorFormulario } from './EditorFormulario'

/**
 * Carga lo que necesita el editor (el diseño si hay `:id` y los catálogos) y
 * monta el formulario. El formulario se monta de nuevo si cambia el `id`.
 */
export function EditorPagina() {
  const { id } = useParams()
  const muebles = useConsulta(useCallback(() => mueblesApi.listar({ limite: 100 }), []))
  const granitos = useConsulta(useCallback(() => granitosApi.listar({ limite: 100 }), []))
  const diseno = useConsulta(useCallback(() => (id === undefined ? Promise.resolve(null) : disenosApi.obtener(id)), [id]))

  const inicial = useMemo(() => (diseno.datos ? aEntrada(diseno.datos) : disenoVacio()), [diseno.datos])

  const cargando = muebles.cargando || granitos.cargando || diseno.cargando
  const error = muebles.error ?? granitos.error ?? diseno.error
  if (cargando || error !== undefined || !muebles.datos || !granitos.datos) {
    return (
      <Box sx={{ p: 3 }}>
        <EstadoConsulta
          cargando={cargando}
          error={error}
          onReintentar={() => {
            muebles.recargar()
            granitos.recargar()
            diseno.recargar()
          }}
        />
      </Box>
    )
  }

  return (
    <EditorFormulario
      key={id ?? 'nuevo'}
      id={id}
      inicial={inicial}
      codigoPublico={diseno.datos?.codigoPublico}
      destacado={diseno.datos?.destacado ?? false}
      muebles={muebles.datos.items}
      granitos={granitos.datos.items}
    />
  )
}
