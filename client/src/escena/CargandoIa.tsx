import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { keyframes } from '@mui/material/styles'

const escanear = keyframes`
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(118px); opacity: 0; }
`
const dibujar = keyframes`
  0% { stroke-dashoffset: 420; }
  60%, 100% { stroke-dashoffset: 0; }
`
const brillar = keyframes`
  0%, 100% { transform: scale(0.6); opacity: 0.2; }
  50% { transform: scale(1); opacity: 1; }
`
const aparecer = keyframes`from { opacity: 0; } to { opacity: 1; }`

/**
 * Lo que se ve sobre la vista 3D mientras la IA trabaja (leer la foto del espacio, entender
 * un pedido): una cocina en líneas que se dibuja sola, una franja que la "escanea" y destellos.
 * Es SVG + CSS: no descarga nada. `role="status"` lo anuncia a los lectores de pantalla.
 */
export function CargandoIa({ mensaje }: { mensaje: string }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeItems: 'center',
        bgcolor: 'vidrio', backdropFilter: 'blur(3px)', animation: `${aparecer} 200ms ease-out`,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, px: 3, textAlign: 'center' }}>
        <Box sx={{ position: 'relative', width: 220, height: 150, color: 'primary.main' }}>
          <svg viewBox="0 0 220 150" width="220" height="150" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {/* mesón en perspectiva */}
              <path d="M20 70 L120 45 L200 70 L100 98 Z" strokeDasharray="420" style={{ animation: `${dibujar} 2.4s ease-in-out infinite` }} />
              {/* cuerpo de los muebles */}
              <path d="M20 70 L20 118 L100 146 L200 118 L200 70" strokeDasharray="420" style={{ animation: `${dibujar} 2.4s ease-in-out 0.3s infinite` }} />
              <path d="M100 98 L100 146" strokeDasharray="420" style={{ animation: `${dibujar} 2.4s ease-in-out 0.5s infinite` }} />
              {/* puertas */}
              <path d="M60 84 L60 132 M150 84 L150 132" strokeDasharray="420" opacity="0.6" style={{ animation: `${dibujar} 2.4s ease-in-out 0.7s infinite` }} />
            </g>
          </svg>
          {/* franja que escanea */}
          <Box
            sx={{
              position: 'absolute', left: 10, right: 10, top: 24, height: 3, borderRadius: 2,
              background: 'linear-gradient(90deg, transparent, currentColor, transparent)',
              boxShadow: '0 0 12px currentColor', animation: `${escanear} 1.8s ease-in-out infinite`,
            }}
          />
          {/* destellos */}
          {[[18, 18, 0], [196, 30, 0.6], [176, 6, 1.2]].map(([x, y, retraso]) => (
            <Box
              key={`${String(x)}-${String(y)}`}
              aria-hidden="true"
              sx={{ position: 'absolute', left: x, top: y, fontSize: 18, lineHeight: 1, animation: `${brillar} 1.6s ease-in-out ${String(retraso)}s infinite` }}
            >
              ✦
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontWeight: 700 }}>{mensaje}</Typography>
        <Typography variant="body2" color="text.secondary">Esto puede tardar unos segundos.</Typography>
      </Box>
    </Box>
  )
}
