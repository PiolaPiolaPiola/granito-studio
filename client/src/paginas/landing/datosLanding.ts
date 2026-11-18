import type { FormaCocina, MaterialAsignado } from '../../dominio/diseno'
import type { Granito } from '../../dominio/granito'
import type { Mueble } from '../../dominio/mueble'
import type { MuebleResuelto } from '../../escena/distribucion'
import { texturaSvg } from '../../escena/texturaProcedural'

/**
 * Datos propios de la landing pública. No pasan por `api/`: esta página se ve sin
 * sesión y no debe depender de que el backend exponga catálogos a visitantes.
 */

const FECHA = '2026-10-20T15:00:00.000Z'
const id = (prefijo: string, n: number) => `${prefijo}${n.toString(16).padStart(24 - prefijo.length, '0')}`

type Definicion = Pick<Granito, 'nombre' | 'tipo' | 'acabado' | 'etiquetas'> & { base: string; vena: string; estilo: 'grano' | 'vena' | 'liso' }

const DEFINICIONES: Definicion[] = [
  { nombre: 'Negro San Gabriel', tipo: 'granito', acabado: 'brillante', etiquetas: ['negro', 'moderno'], base: '#141416', vena: '#5a5a62', estilo: 'grano' },
  { nombre: 'Blanco Ártico', tipo: 'granito', acabado: 'brillante', etiquetas: ['blanco', 'luminoso'], base: '#f1efea', vena: '#a9a49b', estilo: 'grano' },
  { nombre: 'Verde Ubatuba', tipo: 'granito', acabado: 'brillante', etiquetas: ['verde', 'natural'], base: '#1f3a1c', vena: '#6a9a58', estilo: 'grano' },
  { nombre: 'Gris Mara', tipo: 'granito', acabado: 'mate', etiquetas: ['gris', 'industrial'], base: '#86837c', vena: '#d2cfc8', estilo: 'grano' },
  { nombre: 'Crema Marfil', tipo: 'marmol', acabado: 'brillante', etiquetas: ['beige', 'clásico'], base: '#eadfc6', vena: '#bda06a', estilo: 'vena' },
  { nombre: 'Carrara Blanco', tipo: 'marmol', acabado: 'mate', etiquetas: ['blanco', 'clásico'], base: '#f3f3f1', vena: '#8f8f8a', estilo: 'vena' },
  { nombre: 'Calacatta Oro', tipo: 'marmol', acabado: 'brillante', etiquetas: ['dorado', 'lujo'], base: '#f7f3e9', vena: '#c19a4e', estilo: 'vena' },
  { nombre: 'Cuarzo Blanco Puro', tipo: 'cuarzo', acabado: 'mate', etiquetas: ['blanco', 'minimalista'], base: '#fbfbfa', vena: '#b9b9b3', estilo: 'liso' },
]

export const PIEDRAS_LANDING: Granito[] = DEFINICIONES.map((d, i) => ({
  _id: id('a', i + 1),
  nombre: d.nombre,
  tipo: d.tipo,
  acabado: d.acabado,
  etiquetas: d.etiquetas,
  imagenUrl: texturaSvg(d.base, d.vena, d.estilo, i + 3),
  active: true,
  creationAt: FECHA,
  updatedAt: FECHA,
}))

export const MEDIDAS_LANDING = { ancho: 3.8, fondo: 3.2 }

export const FORMAS_LANDING: Array<{ forma: FormaCocina; etiqueta: string }> = [
  { forma: 'lineal', etiqueta: 'Lineal' },
  { forma: 'L', etiqueta: 'En L' },
  { forma: 'U', etiqueta: 'En U' },
  { forma: 'isla', etiqueta: 'Con isla' },
]

export const COLORES_MUEBLES: Array<{ nombre: string; hex: string }> = [
  { nombre: 'Blanco hueso', hex: '#f1ede4' },
  { nombre: 'Madera miel', hex: '#b88a5a' },
  { nombre: 'Gris grafito', hex: '#5a5d62' },
  { nombre: 'Verde salvia', hex: '#7d8b6e' },
]

const mueble = (n: number, nombre: string, tipo: Mueble['tipo'], anchoCm: number, altoCm: number, fondoCm: number): Mueble => ({
  _id: id('b', n), nombre, tipo, anchoCm, altoCm, fondoCm, active: true, creationAt: FECHA, updatedAt: FECHA,
})

const M = {
  puertas: mueble(1, 'Gabinete 2 puertas', 'inferior', 80, 90, 60),
  tarja: mueble(2, 'Módulo con tarja', 'inferior', 90, 90, 60),
  cajonera: mueble(3, 'Cajonera', 'inferior', 40, 90, 60),
  horno: mueble(4, 'Módulo para horno', 'inferior', 60, 90, 60),
  superior: mueble(5, 'Gabinete superior', 'superior', 80, 72, 35),
  vitrina: mueble(6, 'Vitrina superior', 'superior', 60, 72, 35),
  isla: mueble(7, 'Isla central', 'isla', 180, 95, 90),
}

/** Cocina fija de demostración; solo cambia la forma (y la isla aparece con "Con isla"). */
export function mueblesLanding(forma: FormaCocina): MuebleResuelto[] {
  const base = [M.puertas, M.tarja, M.cajonera, M.horno, M.puertas, M.puertas, M.superior, M.vitrina, M.superior, M.superior]
  const lista = forma === 'isla' ? [...base, M.isla] : base
  return lista.map((m, i) => ({ _id: id('c', i + 1), posicion: i + 1, mueble: m }))
}

export function materialesLanding(muebles: MuebleResuelto[], piedra: Granito, colorHex: string): MaterialAsignado[] {
  return [
    { pieza: 'meson', granito: piedra._id },
    { pieza: 'salpicadero', granito: piedra._id },
    ...muebles.map((m): MaterialAsignado => ({ pieza: 'mueble', muebleEnDiseno: m._id, colorHex })),
  ]
}
