import { normalizarTexto } from '../dominio/comun'
import type { FormaCocina, Salpicadero } from '../dominio/diseno'
import type { Espacio } from '../dominio/mueble'
import type { AccionVoz, ContextoComando } from '../ia/tipos'

/**
 * Intérprete de comandos SIN IA: reglas para las órdenes más comunes en español.
 * Ejemplos: "agrega dos gabinetes inferiores de 60", "quita el último", "cocina en L",
 * "el espacio mide 3,5 por 2,8", "mesón en negro estelar", "con cascada",
 * "salpicadero completo", "espesor 4", "muebles color nogal", "cambia a baño".
 *
 * Devuelve las acciones entendidas y los pedazos de la frase que no entendió (para
 * decidir si vale la pena preguntarle a la IA).
 */
export interface ResultadoLocal {
  acciones: AccionVoz[]
  sinEntender: string[]
}

const NUMEROS: Record<string, number> = {
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
}

const FORMAS: Record<string, FormaCocina> = {
  l: 'L', u: 'U', lineal: 'lineal', recta: 'lineal', isla: 'isla', libre: 'libre',
}

const ESPACIOS: Record<string, Espacio> = { cocina: 'cocina', sala: 'sala', bano: 'bano' }

/** Palabras que no ayudan a reconocer un mueble o una piedra. */
const RELLENO = new Set(['un', 'una', 'uno', 'de', 'del', 'la', 'el', 'los', 'las', 'con', 'para', 'en', 'al', 'a', 'y', 'mueble', 'muebles', 'cm', 'centimetros'])

/** Sinónimos que la gente dice → palabras que aparecen en los nombres del catálogo. */
const SINONIMOS: Record<string, string> = {
  aereo: 'superior', aereos: 'superior', arriba: 'superior', alto: 'superior',
  abajo: 'inferior', bajo: 'inferior', bajos: 'inferior',
  cajones: 'cajonero', cajonera: 'cajonero',
  tv: 'tv', television: 'tv', tele: 'tv',
  lavaplatos: 'lavaplatos', fregadero: 'lavaplatos', estufa: 'estufa',
  espejo: 'espejo', libreria: 'biblioteca', estanteria: 'biblioteca',
}

const numero = (texto: string): number | undefined => {
  const limpio = texto.replace(',', '.')
  const valor = Number(limpio)
  if (Number.isFinite(valor)) return valor
  return NUMEROS[limpio]
}

const palabras = (texto: string) =>
  normalizarTexto(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 0 && !RELLENO.has(p))
    .map((p) => SINONIMOS[p] ?? p.replace(/(es|s)$/, ''))

/** El nombre del catálogo que más palabras comparte con la frase (o undefined). */
export function mejorCoincidencia(frase: string, nombres: string[]): string | undefined {
  const buscadas = new Set(palabras(frase))
  if (buscadas.size === 0) return undefined
  let mejor: { nombre: string; puntaje: number } | undefined
  for (const nombre of nombres) {
    const propias = palabras(nombre)
    const comunes = propias.filter((p) => buscadas.has(p)).length
    // Desempate: preferir el nombre con menos palabras "de más" (los números y "puertas" no
    // cuentan): "gabinete inferior" → "Gabinete inferior 2 puertas", no "… en acero".
    const deMas = propias.filter((p) => !buscadas.has(p) && !/^\d+$/.test(p) && p !== 'puerta').length
    const puntaje = comunes - deMas * 0.01
    if (comunes > 0 && (mejor === undefined || puntaje > mejor.puntaje)) mejor = { nombre, puntaje }
  }
  return mejor?.nombre
}

/** Parte la frase en órdenes: por comas o por "y" cuando sigue otro verbo. */
function partir(texto: string): string[] {
  return normalizarTexto(texto)
    .replace(/(\d),(\d)/g, '$1.$2') // "3,5 metros": la coma decimal no separa órdenes
    .replace(/(\D)[.;]/g, '$1,')
    .split(/,|\by luego\b|\bdespues\b|\btambien\b|\s(?=(?:con|sin) (?:salpicadero|cascada))|\by (?=(agrega|anade|pon|quita|elimina|borra|saca|cambia|forma|cocina|meson|piedra|salpicadero|con|sin|espesor|color|el espacio|medidas))/)
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 1 && !/^(agrega|anade|pon|quita|elimina|borra|saca|cambia|forma|cocina|meson|piedra|salpicadero|con|sin|espesor|color|el espacio|medidas)$/.test(p))
}

function interpretarOrden(orden: string, contexto: ContextoComando): AccionVoz[] | null {
  let m: RegExpMatchArray | null

  if ((m = orden.match(/(?:mide|medidas?|tamano|dimensiones)\D*?(\d+(?:[.,]\d+)?)\s*(?:m|metros)?\s*(?:por|x)\s*(\d+(?:[.,]\d+)?)/))) {
    const ancho = numero(m[1])
    const fondo = numero(m[2])
    if (ancho !== undefined && fondo !== undefined) return [{ tipo: 'medidas', ancho, fondo }]
  }

  if ((m = orden.match(/(?:cambia(?:r)?(?: el espacio)? a|espacio(?: de)?|disenar|disena)\s+(?:un |una |el |la )?(cocina|sala|bano)\b/))) {
    return [{ tipo: 'espacio', espacio: ESPACIOS[m[1]] }]
  }

  if (/\bsin cascada\b|\bquita(?:r)? (?:la )?cascada\b/.test(orden)) return [{ tipo: 'cascada', valor: false }]
  if (/\bcascada\b/.test(orden)) return [{ tipo: 'cascada', valor: true }]

  if (/\bsin salpicadero\b/.test(orden)) return [{ tipo: 'salpicadero', valor: 'ninguno' }]
  if ((m = orden.match(/salpicadero\s+(bajo|completo|alto|entero|ninguno)/))) {
    const valor: Salpicadero = m[1] === 'bajo' ? 'bajo' : m[1] === 'ninguno' ? 'ninguno' : 'completo'
    return [{ tipo: 'salpicadero', valor }]
  }

  if ((m = orden.match(/espesor\D*(\d+(?:[.,]\d+)?)/))) {
    const valor = numero(m[1])
    if (valor !== undefined) return [{ tipo: 'espesor', valor }]
  }

  if ((m = orden.match(/(?:forma|cocina|sala|bano|distribucion)\s+(?:en |con |tipo )?(l|u|lineal|recta|isla|libre)\b/))) {
    return [{ tipo: 'forma', forma: FORMAS[m[1]] }]
  }
  if (/\bsin plantilla\b/.test(orden)) return [{ tipo: 'forma', forma: 'libre' }]

  if ((m = orden.match(/(?:color(?: de(?: los)?)? muebles|muebles(?: en| de)?(?: color)?|color)\s+(.+)/))) {
    return [{ tipo: 'colorMuebles', color: m[1].trim() }]
  }

  if ((m = orden.match(/(?:meson|mesones|encimera|piedra|cubierta)(?: (?:en|de|con|a))?\s+(.+)/))) {
    const piedra = mejorCoincidencia(m[1], contexto.piedras)
    if (piedra !== undefined) {
      const pieza = /salpicadero/.test(orden) ? 'ambos' : 'meson'
      return [{ tipo: 'piedra', piedra, pieza }]
    }
  }
  if ((m = orden.match(/salpicadero(?: (?:en|de|con))?\s+(.+)/))) {
    const piedra = mejorCoincidencia(m[1], contexto.piedras)
    if (piedra !== undefined) return [{ tipo: 'piedra', piedra, pieza: 'salpicadero' }]
  }

  if ((m = orden.match(/^(?:quita(?:r)?|elimina(?:r)?|borra(?:r)?|saca(?:r)?)\s*(.*)$/))) {
    const resto = m[1].trim()
    if (resto === '' || /^(el |la )?(ultimo|ultima)/.test(resto)) return [{ tipo: 'quitar' }]
    const mueble = mejorCoincidencia(resto, contexto.muebles)
    return mueble === undefined ? null : [{ tipo: 'quitar', mueble }]
  }

  if ((m = orden.match(/^(?:agrega(?:r)?|anade|anadir|pon(?:er)?|coloca(?:r)?|mete(?:r)?|suma(?:r)?)\s+(.+)$/))) {
    // "dos gabinetes de 60 y un cajonero" → dos pedidos.
    const pedidos = m[1].split(/\s+y\s+(?=(?:\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s)/)
    const acciones = pedidos.flatMap((pedido) => {
      const accion = interpretarPedido(pedido, contexto)
      return accion === null ? [] : [accion]
    })
    return acciones.length === 0 ? null : acciones
  }

  return null
}

/** "dos gabinetes inferiores de 60" → agregar 2 × el gabinete más parecido, de 60 cm de ancho. */
function interpretarPedido(pedido: string, contexto: ContextoComando): AccionVoz | null {
  let resto = pedido
  let cantidad = 1
  const inicio = resto.match(/^(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+/)
  if (inicio) {
    cantidad = Math.min(10, Math.max(1, numero(inicio[1]) ?? 1))
    resto = resto.slice(inicio[0].length)
  }
  let anchoCm: number | undefined
  const ancho = resto.match(/\bde (\d+(?:\.\d+)?)\s*(cm|centimetros|metros|m)?\b/)
  if (ancho) {
    const valor = numero(ancho[1])
    if (valor !== undefined) anchoCm = ancho[2] === 'm' || ancho[2] === 'metros' ? valor * 100 : valor
    resto = resto.replace(ancho[0], ' ')
  }
  const mueble = mejorCoincidencia(resto, contexto.muebles)
  if (mueble === undefined) return null
  return { tipo: 'agregar', mueble, cantidad, ...(anchoCm !== undefined && anchoCm >= 1 && anchoCm <= 500 ? { anchoCm } : {}) }
}

export function interpretarLocal(texto: string, contexto: ContextoComando): ResultadoLocal {
  const acciones: AccionVoz[] = []
  const sinEntender: string[] = []
  for (const orden of partir(texto)) {
    const resultado = interpretarOrden(orden, contexto)
    if (resultado === null) sinEntender.push(orden)
    else acciones.push(...resultado)
  }
  return { acciones, sinEntender }
}
