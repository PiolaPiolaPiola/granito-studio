import ArrowBack from '@mui/icons-material/ArrowBack'
import ArrowDownward from '@mui/icons-material/ArrowDownward'
import ArrowForward from '@mui/icons-material/ArrowForward'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import Rotate90DegreesCwOutlined from '@mui/icons-material/Rotate90DegreesCwOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '../../componentes/BotonIcono'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { MiniaturaMueble } from '../../componentes/MiniaturaMueble'
import type { FormaCocina, MedidasPieza, MuebleEnDiseno, Rotacion, Ubicacion } from '../../dominio/diseno'
import { ETIQUETA_TIPO_MUEBLE, type Mueble } from '../../dominio/mueble'
import { rotacionDe, type Colocacion } from '../../escena/distribucion'

const PASO_M = 0.05
const CAMPOS = [
  ['ancho', 'Ancho', 'anchoCm'],
  ['alto', 'Alto', 'altoCm'],
  ['fondo', 'Fondo', 'fondoCm'],
] as const

interface Props {
  pieza: MuebleEnDiseno
  mueble: Mueble
  colocacion: Colocacion | undefined
  forma: FormaCocina
  onMedidas: (medidas: MedidasPieza | undefined) => void
  onUbicar: (ubicacion: Ubicacion) => void
  onMaterial: () => void
  onCerrar: () => void
}

/**
 * La pieza seleccionada (con clic en 3D o en la lista): medidas propias de este diseño y,
 * en la forma libre, su posición y giro. Las medidas vacías usan las del catálogo.
 */
export function PanelPieza({ pieza, mueble, colocacion, forma, onMedidas, onUbicar, onMaterial, onCerrar }: Props) {
  // Texto de cada campo mientras se escribe (así un campo vacío no salta a 0).
  const [borrador, setBorrador] = useState<Record<string, string>>({})
  const libre = forma === 'libre'

  const cambiarMedida = (campo: keyof MedidasPieza, texto: string) => {
    setBorrador((b) => ({ ...b, [campo]: texto }))
    const valor = Number(texto)
    const nuevas: MedidasPieza = { ...pieza.medidasCm }
    if (texto === '' || !Number.isFinite(valor)) delete nuevas[campo]
    else if (valor >= 1 && valor <= 500) nuevas[campo] = valor
    else return
    onMedidas(nuevas)
  }

  // Posición actual: la guardada o, si el mueble aún no tiene, la que le dio la plantilla.
  const ubicacion: Ubicacion = pieza.ubicacion ?? {
    x: colocacion?.centro[0] ?? 0,
    z: colocacion?.centro[2] ?? 0,
    rotacion: colocacion === undefined ? 0 : rotacionDe(colocacion.rotY),
  }
  const mover = (dx: number, dz: number) => onUbicar({ ...ubicacion, x: ubicacion.x + dx, z: ubicacion.z + dz })
  const girar = () => onUbicar({ ...ubicacion, rotacion: ((ubicacion.rotacion + 90) % 360) as Rotacion })

  return (
    <Paper component="section" aria-label="Pieza seleccionada" variant="outlined" sx={{ p: 2, borderColor: 'primary.main' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <MiniaturaMueble mueble={mueble} sx={{ width: 40, height: 40, borderRadius: 1.5, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere', lineHeight: 1.3 }}>{pieza.posicion}. {mueble.nombre}</Typography>
          <Typography variant="caption" color="text.secondary">{ETIQUETA_TIPO_MUEBLE[mueble.tipo]}</Typography>
        </Box>
        <IconButton aria-label="Cerrar pieza" onClick={onCerrar}><CloseOutlined /></IconButton>
      </Box>

      <Typography variant="body2" sx={{ mb: 1 }}>Medidas en este diseño (cm)</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
        {CAMPOS.map(([campo, etiqueta, deCatalogo]) => (
          <TextField
            key={campo}
            size="small"
            label={etiqueta}
            type="number"
            placeholder={String(mueble[deCatalogo])}
            value={borrador[campo] ?? (pieza.medidasCm?.[campo]?.toString() ?? '')}
            onChange={(e) => cambiarMedida(campo, e.target.value)}
            slotProps={{ htmlInput: { min: 1, max: 500 }, inputLabel: { shrink: true } }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
        <Button size="small" disabled={pieza.medidasCm === undefined} onClick={() => { setBorrador({}); onMedidas(undefined) }}>
          Usar medidas del catálogo
        </Button>
        <Button size="small" variant="outlined" onClick={onMaterial}>Cambiar material</Button>
      </Box>

      {libre && (
        <>
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>Posición (m) — o arrástralo en la vista 3D</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              label="X"
              type="number"
              value={ubicacion.x}
              onChange={(e) => Number.isFinite(Number(e.target.value)) && onUbicar({ ...ubicacion, x: Number(e.target.value) })}
              slotProps={{ htmlInput: { step: PASO_M } }}
            />
            <TextField
              size="small"
              label="Z"
              type="number"
              value={ubicacion.z}
              onChange={(e) => Number.isFinite(Number(e.target.value)) && onUbicar({ ...ubicacion, z: Number(e.target.value) })}
              slotProps={{ htmlInput: { step: PASO_M } }}
            />
            <IconButton aria-label={`Girar 90 grados (ahora ${ubicacion.rotacion}°)`} onClick={girar}><Rotate90DegreesCwOutlined /></IconButton>
          </Box>
          <Box role="group" aria-label="Mover 5 cm" sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
            <IconButton aria-label="Mover a la izquierda" onClick={() => mover(-PASO_M, 0)}><ArrowBack /></IconButton>
            <IconButton aria-label="Mover hacia el fondo" onClick={() => mover(0, -PASO_M)}><ArrowUpward /></IconButton>
            <IconButton aria-label="Mover hacia el frente" onClick={() => mover(0, PASO_M)}><ArrowDownward /></IconButton>
            <IconButton aria-label="Mover a la derecha" onClick={() => mover(PASO_M, 0)}><ArrowForward /></IconButton>
          </Box>
        </>
      )}
    </Paper>
  )
}
