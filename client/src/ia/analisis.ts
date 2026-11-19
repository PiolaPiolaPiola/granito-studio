import { PALETA_MUEBLES } from '../dominio/paleta'
import { aRgb, cargarImagen, coloresDominantes, luminancia, masCercano, type ColorContado } from './colores'
import type { SugerenciaGranito, SugerenciaMueble } from './tipos'

export type TipoAnalisis = 'mueble' | 'granito'

export interface ResultadoAnalisis<T extends TipoAnalisis> {
  sugerencia: T extends 'mueble' ? SugerenciaMueble : SugerenciaGranito
  colores: ColorContado[]
  /** Texto corto para el usuario: de dónde salió la sugerencia. */
  fuente: string
}

/** Análisis local: colores dominantes → color del mueble, o etiquetas de la piedra. */
export async function analizarSinIa<T extends TipoAnalisis>(tipo: T, archivo: File): Promise<ResultadoAnalisis<T>> {
  const imagen = await cargarImagen(archivo)
  const colores = coloresDominantes(imagen)
  const sugerencia = tipo === 'mueble' ? sugerirMueble(colores) : sugerirGranito(colores)
  return {
    sugerencia: sugerencia as ResultadoAnalisis<T>['sugerencia'],
    colores,
    fuente: 'Colores detectados en tu navegador (sin IA)',
  }
}

function sugerirMueble(colores: ColorContado[]): SugerenciaMueble {
  const [principal] = colores
  if (principal === undefined) return {}
  return { colorHex: masCercano(principal.hex, PALETA_MUEBLES).hex }
}

/** Nombre de color en español a partir del tono y la luz (para las etiquetas). */
export function nombreDeColor(hex: string): string {
  const [r, g, b] = aRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const luz = luminancia(hex)
  const saturacion = max === 0 ? 0 : (max - min) / max
  if (saturacion < 0.12) {
    if (luz > 205) return 'blanco'
    if (luz < 55) return 'negro'
    return 'gris'
  }
  // Tono en grados (0 rojo, 60 amarillo, 120 verde, 240 azul).
  let tono: number
  if (max === r) tono = 60 * (((g - b) / (max - min)) % 6)
  else if (max === g) tono = 60 * ((b - r) / (max - min) + 2)
  else tono = 60 * ((r - g) / (max - min) + 4)
  if (tono < 0) tono += 360
  if (tono < 50) return luz > 170 ? 'beige' : 'cafe'
  if (tono < 70) return 'dorado'
  if (tono < 170) return 'verde'
  if (tono < 260) return 'azul'
  return 'rojo'
}

function sugerirGranito(colores: ColorContado[]): SugerenciaGranito {
  const [base, ...resto] = colores
  if (base === undefined) return {}
  const etiquetas = new Set<string>([nombreDeColor(base.hex), luminancia(base.hex) > 150 ? 'claro' : 'oscuro'])

  // Un segundo color muy distinto y escaso = destellos o vetas sobre la base.
  const contraste = resto.find((c) => Math.abs(luminancia(c.hex) - luminancia(base.hex)) > 70)
  if (contraste !== undefined) {
    etiquetas.add(contraste.peso < 0.06 ? 'destellos' : 'veteado')
    etiquetas.add(nombreDeColor(contraste.hex))
  } else {
    etiquetas.add('liso')
  }
  return { etiquetas: [...etiquetas] }
}
