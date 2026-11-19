import type { ColorPaleta } from '../dominio/paleta'

/**
 * Análisis de color SIN inteligencia artificial: se dibuja la foto pequeña en un canvas y se
 * cuentan los píxeles por "cubetas" de color (cuantización). Las cubetas más llenas son los
 * colores dominantes. Corre en el navegador, gratis y sin enviar la foto a nadie.
 */

export interface ColorContado {
  hex: string
  /** Fracción de los píxeles analizados (0–1). */
  peso: number
}

const LADO = 72
/** 4 bits por canal → 4096 cubetas: suficiente para separar colores sin ruido. */
const BITS = 4

export async function cargarImagen(archivo: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(archivo)
  try {
    const imagen = new Image()
    imagen.src = url
    await imagen.decode()
    return imagen
  } finally {
    // decode() ya leyó los bytes: la URL temporal se puede liberar.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

/** Colores dominantes del centro de la imagen (el 60 % central, donde suele estar el objeto). */
export function coloresDominantes(imagen: CanvasImageSource & { width: number; height: number }, cantidad = 5): ColorContado[] {
  const canvas = document.createElement('canvas')
  canvas.width = LADO
  canvas.height = LADO
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (ctx === null) return []
  const margenX = imagen.width * 0.2
  const margenY = imagen.height * 0.2
  ctx.drawImage(imagen, margenX, margenY, imagen.width * 0.6, imagen.height * 0.6, 0, 0, LADO, LADO)
  const { data } = ctx.getImageData(0, 0, LADO, LADO)

  const cubetas = new Map<number, { r: number; g: number; b: number; n: number }>()
  const desplazar = 8 - BITS
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    const clave = ((r >> desplazar) << (2 * BITS)) | ((g >> desplazar) << BITS) | (b >> desplazar)
    const cubeta = cubetas.get(clave) ?? { r: 0, g: 0, b: 0, n: 0 }
    cubeta.r += r
    cubeta.g += g
    cubeta.b += b
    cubeta.n += 1
    cubetas.set(clave, cubeta)
  }

  const total = LADO * LADO
  const ordenadas = [...cubetas.values()].sort((a, b) => b.n - a.n)
  const resultado: ColorContado[] = []
  for (const c of ordenadas) {
    const hex = aHex(c.r / c.n, c.g / c.n, c.b / c.n)
    // Se descartan tonos casi iguales a uno ya elegido (cubetas vecinas).
    if (resultado.some((x) => distancia(x.hex, hex) < 28)) continue
    resultado.push({ hex, peso: c.n / total })
    if (resultado.length === cantidad) break
  }
  return resultado
}

/** El color de la paleta más parecido (distancia en RGB, suficiente para sugerir). */
export function masCercano(hex: string, paleta: ColorPaleta[]): ColorPaleta {
  return paleta.reduce((mejor, c) => (distancia(c.hex, hex) < distancia(mejor.hex, hex) ? c : mejor))
}

/** Luminancia percibida 0–255: sirve para decir si una piedra es clara u oscura. */
export function luminancia(hex: string): number {
  const [r, g, b] = aRgb(hex)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function aRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function aHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

function distancia(a: string, b: string): number {
  const [r1, g1, b1] = aRgb(a)
  const [r2, g2, b2] = aRgb(b)
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2)
}
