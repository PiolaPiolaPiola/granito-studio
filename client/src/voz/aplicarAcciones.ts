import { normalizarTexto } from '../dominio/comun'
import {
  agregarMueble,
  asignarMaterial,
  cambiarMedidasPieza,
  ETIQUETA_FORMA,
  ETIQUETA_SALPICADERO,
  quitarMuebleDeDiseno,
  type EntradaDiseno,
} from '../dominio/diseno'
import type { Granito } from '../dominio/granito'
import { espacioDe, ETIQUETA_ESPACIO, type Mueble } from '../dominio/mueble'
import { PALETA_MUEBLES, PALETA_PAREDES, PALETA_PISOS, PALETA_TECHOS, type ColorPaleta } from '../dominio/paleta'
import { ETIQUETA_OBJETO, objetosPorDefecto } from '../dominio/objetos'
import { generarObjectId } from '../infra/generarId'
import type { AccionVoz } from '../ia/tipos'
import { mejorCoincidencia } from './interpretarLocal'

export interface ResultadoAcciones {
  diseno: EntradaDiseno
  /** Qué se hizo, para mostrárselo al usuario. */
  hechas: string[]
  /** Lo que no se pudo hacer (mueble o piedra que no existe…). */
  fallidas: string[]
}

/** Colores básicos que la gente nombra y no están en la paleta de las fotos. */
const COLORES_BASICOS: Record<string, string> = {
  negro: '#232325', gris: '#8e9193', blanco: '#f2f1ee', beige: '#d9cbb8', cafe: '#6b4a32',
  verde: '#6f7559', azul: '#2f4a5c', madera: '#c9b49a',
}

function resolverColor(texto: string, paleta: ColorPaleta[] = PALETA_MUEBLES): { hex: string; nombre: string } | undefined {
  const limpio = normalizarTexto(texto)
  if (/^#[0-9a-f]{6}$/.test(limpio)) return { hex: limpio, nombre: limpio }
  const dePaleta = paleta.find((c) => limpio.includes(normalizarTexto(c.nombre)) || normalizarTexto(c.nombre).includes(limpio))
  if (dePaleta) return { hex: dePaleta.hex, nombre: dePaleta.nombre }
  const basico = Object.entries(COLORES_BASICOS).find(([nombre]) => limpio.includes(nombre))
  return basico ? { hex: basico[1], nombre: basico[0] } : undefined
}

/** Busca por nombre exacto (sin tildes) y, si no, por la mejor coincidencia de palabras. */
function buscarPorNombre<T extends { nombre: string }>(lista: T[], nombre: string): T | undefined {
  const exacto = lista.find((x) => normalizarTexto(x.nombre) === normalizarTexto(nombre))
  if (exacto) return exacto
  const parecido = mejorCoincidencia(nombre, lista.map((x) => x.nombre))
  return parecido === undefined ? undefined : lista.find((x) => x.nombre === parecido)
}

/**
 * Aplica acciones de voz a un diseño. Función PURA: recibe el diseño y devuelve uno nuevo,
 * así el editor solo tiene que copiar el resultado al formulario.
 */
export function aplicarAcciones(
  inicial: EntradaDiseno,
  acciones: AccionVoz[],
  catalogo: Mueble[],
  granitos: Granito[],
): ResultadoAcciones {
  let d: EntradaDiseno = { ...inicial }
  const hechas: string[] = []
  const fallidas: string[] = []

  for (const accion of acciones) {
    switch (accion.tipo) {
      case 'agregar': {
        // Primero en el espacio actual; si no, en todo el catálogo.
        const mueble = buscarPorNombre(catalogo.filter((m) => espacioDe(m) === d.espacio), accion.mueble) ?? buscarPorNombre(catalogo, accion.mueble)
        if (mueble === undefined) {
          fallidas.push(`No encontré el mueble "${accion.mueble}"`)
          break
        }
        for (let i = 0; i < accion.cantidad; i += 1) {
          d = { ...d, muebles: agregarMueble(d.muebles, mueble._id) }
          const nuevo = d.muebles[d.muebles.length - 1]
          if (accion.anchoCm !== undefined) d = { ...d, muebles: cambiarMedidasPieza(d.muebles, nuevo._id, { ancho: accion.anchoCm }) }
        }
        hechas.push(`Agregué ${String(accion.cantidad)} × ${mueble.nombre}${accion.anchoCm !== undefined ? ` de ${String(accion.anchoCm)} cm` : ''}`)
        break
      }
      case 'quitar': {
        const ordenados = [...d.muebles].sort((a, b) => b.posicion - a.posicion)
        const objetivo =
          accion.mueble === undefined
            ? ordenados[0]
            : ordenados.find((m) => {
                const nombre = catalogo.find((c) => c._id === m.mueble)?.nombre ?? ''
                return buscarPorNombre([{ nombre }], accion.mueble ?? '') !== undefined
              })
        if (objetivo === undefined) {
          fallidas.push(accion.mueble === undefined ? 'No hay muebles para quitar' : `No hay "${accion.mueble}" en el diseño`)
          break
        }
        const resultado = quitarMuebleDeDiseno(d.muebles, d.materiales, objetivo._id)
        d = { ...d, ...resultado }
        hechas.push(`Quité ${catalogo.find((c) => c._id === objetivo.mueble)?.nombre ?? 'un mueble'}`)
        break
      }
      case 'forma':
        d = { ...d, forma: accion.forma }
        hechas.push(`Forma: ${ETIQUETA_FORMA[accion.forma]}`)
        break
      case 'espacio':
        d = { ...d, espacio: accion.espacio }
        hechas.push(`Espacio: ${ETIQUETA_ESPACIO[accion.espacio]}`)
        break
      case 'medidas': {
        // Un cuarto de menos de 1,5 m de fondo no cabe ni un mueble con paso: se corrige.
        const ancho = Math.max(1.2, accion.ancho ?? d.medidasM.ancho)
        const fondo = Math.max(1.5, accion.fondo ?? d.medidasM.fondo)
        d = { ...d, medidasM: { ancho, fondo } }
        hechas.push(`Medidas: ${String(d.medidasM.ancho)} × ${String(d.medidasM.fondo)} m`)
        break
      }
      case 'piedra': {
        const granito = buscarPorNombre(granitos, accion.piedra)
        if (granito === undefined) {
          fallidas.push(`No encontré la piedra "${accion.piedra}"`)
          break
        }
        const piezas = accion.pieza === 'ambos' ? (['meson', 'salpicadero'] as const) : ([accion.pieza] as const)
        let materiales = d.materiales
        for (const pieza of piezas) materiales = asignarMaterial(materiales, pieza, undefined, { granito: granito._id })
        d = { ...d, materiales }
        hechas.push(`${accion.pieza === 'salpicadero' ? 'Salpicadero' : 'Mesón'} en ${granito.nombre}`)
        break
      }
      case 'salpicadero':
        d = { ...d, acabados: { ...d.acabados, salpicadero: accion.valor } }
        hechas.push(`Salpicadero: ${ETIQUETA_SALPICADERO[accion.valor].toLowerCase()}`)
        break
      case 'cascada':
        d = { ...d, acabados: { ...d.acabados, cascada: accion.valor } }
        hechas.push(accion.valor ? 'Con caída en cascada' : 'Sin cascada')
        break
      case 'espesor':
        d = { ...d, acabados: { ...d.acabados, espesorCm: Math.min(10, Math.max(1, accion.valor)) } }
        hechas.push(`Espesor del mesón: ${String(accion.valor)} cm`)
        break
      case 'entorno': {
        const paleta = accion.parte === 'pared' ? PALETA_PAREDES : accion.parte === 'piso' ? PALETA_PISOS : PALETA_TECHOS
        const color = resolverColor(accion.color, paleta)
        const parte = accion.parte === 'pared' ? 'Paredes' : accion.parte === 'piso' ? 'Piso' : 'Techo'
        if (color === undefined) {
          fallidas.push(`No reconocí el color "${accion.color}" para ${parte.toLowerCase()}`)
          break
        }
        d = { ...d, entorno: { ...d.entorno, [accion.parte]: color.hex } }
        hechas.push(`${parte} en ${color.nombre}`)
        break
      }
      case 'objeto': {
        const nombre = ETIQUETA_OBJETO[accion.objeto]
        if (accion.quitar === true) {
          const ultimo = [...d.objetos].reverse().find((o) => o.tipo === accion.objeto)
          if (ultimo === undefined) {
            fallidas.push(`No hay ${nombre.toLowerCase()} en el diseño`)
            break
          }
          d = { ...d, objetos: d.objetos.filter((o) => o._id !== ultimo._id) }
          hechas.push(`Quité ${nombre.toLowerCase()}`)
          break
        }
        // Donde lo pondría un espacio nuevo; si ese espacio no lo trae, en el centro.
        const sugerido = objetosPorDefecto(d.espacio, d.medidasM).find((o) => o.tipo === accion.objeto)
        const ubicacion = sugerido?.ubicacion ?? { x: 0, z: 0, rotacion: 0 as const }
        d = { ...d, objetos: [...d.objetos, { _id: generarObjectId(), tipo: accion.objeto, ubicacion }] }
        hechas.push(`Agregué ${nombre.toLowerCase()}`)
        break
      }
      case 'colorMuebles': {
        const color = resolverColor(accion.color)
        if (color === undefined) {
          fallidas.push(`No reconocí el color "${accion.color}"`)
          break
        }
        let materiales = d.materiales
        for (const m of d.muebles) materiales = asignarMaterial(materiales, 'mueble', m._id, { colorHex: color.hex })
        d = { ...d, materiales }
        hechas.push(`Muebles en ${color.nombre}`)
        break
      }
    }
  }
  return { diseno: d, hechas, fallidas }
}
