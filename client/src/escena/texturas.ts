import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { aRgb } from '../ia/colores'

/**
 * Textura de madera generada en un canvas (sin descargar imágenes): franjas verticales
 * de veta con variaciones suaves de tono sobre el color elegido. Se guarda en caché por
 * color, así todos los muebles del mismo acabado comparten una sola textura.
 */
const cache = new Map<string, CanvasTexture>()

export function texturaMadera(colorHex: string): CanvasTexture {
  const clave = colorHex.toLowerCase()
  const existente = cache.get(clave)
  if (existente !== undefined) return existente

  const lado = 256
  const canvas = document.createElement('canvas')
  canvas.width = lado
  canvas.height = lado
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('El navegador no permite dibujar en canvas')

  const [r, g, b] = aRgb(clave)
  ctx.fillStyle = clave
  ctx.fillRect(0, 0, lado, lado)

  // Generador pseudoaleatorio con semilla: la misma veta en cada recarga.
  let semilla = r * 65536 + g * 256 + b + 1
  const azar = () => {
    semilla = (semilla * 16807) % 2147483647
    return semilla / 2147483647
  }

  for (let x = 0; x < lado; x += 1) {
    const onda = Math.sin(x * 0.09 + azar() * 0.4) * 0.5 + Math.sin(x * 0.023) * 0.5
    const variacion = onda * 14 + (azar() - 0.5) * 10
    ctx.fillStyle = `rgba(${clamp(r + variacion)}, ${clamp(g + variacion)}, ${clamp(b + variacion)}, 0.55)`
    ctx.fillRect(x, 0, 1, lado)
  }
  // Algunas vetas oscuras finas que ondulan.
  for (let i = 0; i < 9; i += 1) {
    const x0 = azar() * lado
    ctx.strokeStyle = `rgba(0, 0, 0, ${0.05 + azar() * 0.07})`
    ctx.lineWidth = 0.6 + azar() * 1.2
    ctx.beginPath()
    for (let y = 0; y <= lado; y += 8) {
      const x = x0 + Math.sin(y * 0.03 + i) * 4
      if (y === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const textura = new CanvasTexture(canvas)
  textura.wrapS = textura.wrapT = RepeatWrapping
  textura.colorSpace = SRGBColorSpace
  textura.anisotropy = 4
  cache.set(clave, textura)
  return textura
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}
