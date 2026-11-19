import Tooltip from '@mui/material/Tooltip'
import type { ReactElement } from 'react'

/** Tooltip para un botón con texto (funciona aunque el botón esté deshabilitado). */
export function ConAyuda({ titulo, children }: { titulo: string; children: ReactElement }) {
  return (
    <Tooltip title={titulo}>
      <span style={{ display: 'inline-flex' }}>{children}</span>
    </Tooltip>
  )
}
