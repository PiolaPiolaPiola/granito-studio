import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface Props {
  titulo: string
  detalle?: string
  abierta: boolean
  onAbrir: () => void
  children: ReactNode
}

/** Sección desplegable del panel derecho. El editor decide cuál está abierta (solo una a la vez). */
export function Seccion({ titulo, detalle, abierta, onAbrir, children }: Props) {
  return (
    <Accordion
      expanded={abierta}
      onChange={onAbrir}
      disableGutters
      variant="outlined"
      slotProps={{ transition: { unmountOnExit: true } }}
      sx={{ borderRadius: 2, '&::before': { display: 'none' }, overflow: 'hidden' }}
    >
      <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ minHeight: 52, '& .MuiAccordionSummary-content': { alignItems: 'baseline', gap: 1 } }}>
        <Typography component="h2" variant="h2">{titulo}</Typography>
        {detalle !== undefined && <Typography variant="caption" color="text.secondary">{detalle}</Typography>}
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>{children}</AccordionDetails>
    </Accordion>
  )
}
