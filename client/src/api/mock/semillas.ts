import type { Diseno } from '../../dominio/diseno'
import type { Acabado, Granito, TipoPiedra } from '../../dominio/granito'
import type { Mueble, TipoMueble } from '../../dominio/mueble'
import { texturaSvg, type EstiloTextura } from '../../escena/texturaProcedural'

/** Ids fijos y válidos (24 hex) para que los diseños semilla apunten a ellos. */
const id = (prefijo: string, n: number) => `${prefijo}${n.toString(16).padStart(24 - prefijo.length, '0')}`
const idGranito = (n: number) => id('a', n)
const idMueble = (n: number) => id('b', n)
const idEnDiseno = (disenoN: number, n: number) => id(`c${disenoN}`, n)
const idDiseno = (n: number) => id('d', n)

const FECHA = '2026-10-20T15:00:00.000Z'
const tiempos = (n: number) => ({ creationAt: FECHA, updatedAt: new Date(Date.parse(FECHA) + n * 86_400_000).toISOString() })

interface DefinicionGranito {
  nombre: string
  tipo: TipoPiedra
  acabado: Acabado
  etiquetas: string[]
  base: string
  vena: string
  estilo: EstiloTextura
}

const DEFINICIONES_GRANITO: DefinicionGranito[] = [
  { nombre: 'Negro San Gabriel', tipo: 'granito', acabado: 'brillante', etiquetas: ['negro', 'moderno', 'elegante'], base: '#141416', vena: '#5a5a62', estilo: 'grano' },
  { nombre: 'Blanco Ártico', tipo: 'granito', acabado: 'brillante', etiquetas: ['blanco', 'luminoso', 'moderno'], base: '#f1efea', vena: '#a9a49b', estilo: 'grano' },
  { nombre: 'Verde Ubatuba', tipo: 'granito', acabado: 'brillante', etiquetas: ['verde', 'natural'], base: '#1f3a1c', vena: '#6a9a58', estilo: 'grano' },
  { nombre: 'Gris Mara', tipo: 'granito', acabado: 'mate', etiquetas: ['gris', 'industrial'], base: '#86837c', vena: '#d2cfc8', estilo: 'grano' },
  { nombre: 'Beige Bahía', tipo: 'granito', acabado: 'mate', etiquetas: ['beige', 'cálido', 'clásico'], base: '#cdbd9f', vena: '#8d7556', estilo: 'grano' },
  { nombre: 'Crema Marfil', tipo: 'marmol', acabado: 'brillante', etiquetas: ['beige', 'clásico', 'elegante'], base: '#eadfc6', vena: '#bda06a', estilo: 'vena' },
  { nombre: 'Carrara Blanco', tipo: 'marmol', acabado: 'mate', etiquetas: ['blanco', 'gris', 'clásico'], base: '#f3f3f1', vena: '#8f8f8a', estilo: 'vena' },
  { nombre: 'Calacatta Oro', tipo: 'marmol', acabado: 'brillante', etiquetas: ['blanco', 'dorado', 'lujo'], base: '#f7f3e9', vena: '#c19a4e', estilo: 'vena' },
  { nombre: 'Cuarzo Blanco Puro', tipo: 'cuarzo', acabado: 'mate', etiquetas: ['blanco', 'minimalista'], base: '#fbfbfa', vena: '#b9b9b3', estilo: 'liso' },
]

export function crearGranitosSemilla(): Granito[] {
  return DEFINICIONES_GRANITO.map((d, i) => ({
    _id: idGranito(i + 1),
    nombre: d.nombre,
    tipo: d.tipo,
    acabado: d.acabado,
    etiquetas: d.etiquetas,
    imagenUrl: texturaSvg(d.base, d.vena, d.estilo, i + 3),
    active: true,
    ...tiempos(i),
  }))
}

const DEFINICIONES_MUEBLE: Array<[string, TipoMueble, number, number, number]> = [
  ['Gabinete inferior 2 puertas', 'inferior', 80, 90, 60],
  ['Cajonera inferior 3 cajones', 'inferior', 40, 90, 60],
  ['Módulo para horno', 'inferior', 60, 90, 60],
  ['Módulo con tarja', 'inferior', 90, 90, 60],
  ['Gabinete superior 2 puertas', 'superior', 80, 72, 35],
  ['Gabinete superior vitrina', 'superior', 60, 72, 35],
  ['Isla central con cubierta', 'isla', 180, 95, 90],
  ['Alacena doble', 'alacena', 120, 210, 45],
  ['Alacena esquinera', 'alacena', 90, 210, 45],
]

export function crearMueblesSemilla(): Mueble[] {
  return DEFINICIONES_MUEBLE.map(([nombre, tipo, anchoCm, altoCm, fondoCm], i) => ({
    _id: idMueble(i + 1),
    nombre,
    tipo,
    anchoCm,
    altoCm,
    fondoCm,
    active: true,
    ...tiempos(i),
  }))
}

export function crearDisenosSemilla(): Diseno[] {
  return [
    {
      _id: idDiseno(1),
      nombre: 'Cocina apartamento modelo',
      forma: 'L',
      medidasM: { ancho: 3.4, fondo: 2.6 },
      muebles: [
        { _id: idEnDiseno(1, 1), mueble: idMueble(1), posicion: 1 },
        { _id: idEnDiseno(1, 2), mueble: idMueble(4), posicion: 2 },
        { _id: idEnDiseno(1, 3), mueble: idMueble(2), posicion: 3 },
        { _id: idEnDiseno(1, 4), mueble: idMueble(3), posicion: 4 },
        { _id: idEnDiseno(1, 5), mueble: idMueble(1), posicion: 5 },
        { _id: idEnDiseno(1, 6), mueble: idMueble(5), posicion: 6 },
        { _id: idEnDiseno(1, 7), mueble: idMueble(6), posicion: 7 },
        { _id: idEnDiseno(1, 8), mueble: idMueble(5), posicion: 8 },
      ],
      materiales: [
        { pieza: 'meson', granito: idGranito(1) },
        { pieza: 'salpicadero', granito: idGranito(1) },
        { pieza: 'mueble', muebleEnDiseno: idEnDiseno(1, 1), colorHex: '#f4f1ea' },
        { pieza: 'mueble', muebleEnDiseno: idEnDiseno(1, 2), colorHex: '#f4f1ea' },
      ],
      ...tiempos(0),
    },
    {
      _id: idDiseno(2),
      nombre: 'Cocina casa campestre',
      forma: 'isla',
      medidasM: { ancho: 4.2, fondo: 3.6 },
      muebles: [
        { _id: idEnDiseno(2, 1), mueble: idMueble(4), posicion: 1 },
        { _id: idEnDiseno(2, 2), mueble: idMueble(1), posicion: 2 },
        { _id: idEnDiseno(2, 3), mueble: idMueble(3), posicion: 3 },
        { _id: idEnDiseno(2, 4), mueble: idMueble(1), posicion: 4 },
        { _id: idEnDiseno(2, 5), mueble: idMueble(7), posicion: 5 },
        { _id: idEnDiseno(2, 6), mueble: idMueble(5), posicion: 6 },
      ],
      materiales: [
        { pieza: 'meson', granito: idGranito(7) },
        { pieza: 'salpicadero', granito: idGranito(7) },
        { pieza: 'mueble', muebleEnDiseno: idEnDiseno(2, 5), colorHex: '#b88a5a' },
      ],
      ...tiempos(4),
    },
  ]
}
