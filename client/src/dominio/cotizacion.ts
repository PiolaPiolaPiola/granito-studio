import type { AcabadosMeson, MaterialAsignado } from './diseno'
import type { Granito } from './granito'
import type { TipoMueble } from './mueble'

/**
 * Reglas del trabajo en piedra, compartidas por la escena 3D y la cotización: así lo que se
 * dibuja y lo que se cobra salen de la misma fuente.
 */
export const CON_MESON: readonly TipoMueble[] = ['inferior', 'isla', 'barra', 'lavamanos']
export const CON_SALPICADERO: readonly TipoMueble[] = ['inferior', 'lavamanos']
export const CON_CASCADA: readonly TipoMueble[] = ['isla', 'barra']
/** Cuánto sobresale el mesón por el frente (m). */
export const VUELO_MESON = 0.03
export const ALTURA_SALPICADERO = { ninguno: 0, bajo: 0.1, completo: 0.6 } as const

/** Lo mínimo que la cotización necesita de cada mueble ya colocado. */
export interface PiezaParaCotizar {
  nombre: string
  tipo: TipoMueble
  /** Metros. */
  ancho: number
  alto: number
  fondo: number
}

export interface LineaPiedra {
  descripcion: string
  /** Metros cuadrados. */
  area: number
}

export interface GrupoPiedra {
  /** Nombre de la piedra o "Sin piedra asignada". */
  piedra: string
  granito?: Granito
  lineas: LineaPiedra[]
  area: number
  /** Pesos; undefined si la piedra no tiene precio cargado. */
  subtotal?: number
}

export interface Cotizacion {
  grupos: GrupoPiedra[]
  areaTotal: number
  /** Metros lineales de canto pulido a la vista (frentes de mesón). */
  cantoM: number
  perforaciones: number
  /** Suma de los grupos con precio. */
  total: number
  faltanPrecios: boolean
}

const redondear = (v: number) => Math.round(v * 1000) / 1000

/** Metros cuadrados de piedra por pieza: mesón, cascada y salpicadero (cada uno con su material). */
export function calcularCotizacion(
  piezas: PiezaParaCotizar[],
  acabados: AcabadosMeson,
  materiales: MaterialAsignado[],
  granitosPorId: Map<string, Granito>,
): Cotizacion {
  const piedraDe = (pieza: 'meson' | 'salpicadero') => {
    const id = materiales.find((m) => m.pieza === pieza && m.muebleEnDiseno === undefined)?.granito
    return id === undefined ? undefined : granitosPorId.get(id)
  }
  const meson = piedraDe('meson')
  const salpicadero = piedraDe('salpicadero')
  const grupos = new Map<string, GrupoPiedra>()
  const agregar = (granito: Granito | undefined, descripcion: string, area: number) => {
    if (area <= 0) return
    const clave = granito?._id ?? 'sin-piedra'
    const grupo = grupos.get(clave) ?? { piedra: granito?.nombre ?? 'Sin piedra asignada', granito, lineas: [], area: 0 }
    grupo.lineas.push({ descripcion, area: redondear(area) })
    grupo.area = redondear(grupo.area + area)
    grupos.set(clave, grupo)
  }

  let cantoM = 0
  let perforaciones = 0
  const altoSalpicadero = ALTURA_SALPICADERO[acabados.salpicadero]
  for (const p of piezas) {
    const fondoMeson = p.fondo + VUELO_MESON
    const medidas = `${cm(p.ancho)} × ${cm(fondoMeson)} cm`
    if (CON_MESON.includes(p.tipo)) {
      agregar(meson, `Mesón · ${p.nombre} (${medidas})`, p.ancho * fondoMeson)
      cantoM += p.ancho
      if (p.tipo === 'lavamanos') perforaciones += 2 // lavamanos + grifería
    }
    if (acabados.cascada && CON_CASCADA.includes(p.tipo)) {
      agregar(meson, `Cascada · ${p.nombre} (2 × ${cm(p.alto)} × ${cm(fondoMeson)} cm)`, 2 * p.alto * fondoMeson)
      cantoM += 2 * p.alto
    }
    if (altoSalpicadero > 0 && CON_SALPICADERO.includes(p.tipo)) {
      agregar(salpicadero, `Salpicadero · ${p.nombre} (${cm(p.ancho)} × ${cm(altoSalpicadero)} cm)`, p.ancho * altoSalpicadero)
    }
  }

  const lista = [...grupos.values()].map((g) => ({
    ...g,
    subtotal: g.granito?.precioM2 === undefined ? undefined : Math.round(g.area * g.granito.precioM2),
  }))
  return {
    grupos: lista,
    areaTotal: redondear(lista.reduce((s, g) => s + g.area, 0)),
    cantoM: redondear(cantoM),
    perforaciones,
    total: lista.reduce((s, g) => s + (g.subtotal ?? 0), 0),
    faltanPrecios: lista.some((g) => g.subtotal === undefined),
  }
}

function cm(metros: number): string {
  return String(Math.round(metros * 100))
}

const formatoPesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
export const pesos = (valor: number) => formatoPesos.format(valor)
export const metrosCuadrados = (valor: number) => `${valor.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m²`
