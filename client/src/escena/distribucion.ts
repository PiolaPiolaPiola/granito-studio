import type { FormaCocina, MedidasM, MedidasPieza, Rotacion, Ubicacion } from '../dominio/diseno'
import type { Mueble, TipoMueble } from '../dominio/mueble'

/**
 * Distribución de los muebles en el espacio: función PURA (datos → posiciones 3D),
 * sin React ni three.js, para poder probarla y razonarla por separado.
 *
 * Sistema de coordenadas (metros): X a la derecha, Y arriba, Z hacia el espectador.
 * El espacio está centrado en el origen; la pared del fondo está en z = -fondo/2.
 *
 * Formas con plantilla: cada forma define "tramos" (paredes por donde corre una hilera).
 * Los muebles, en orden de `posicion`, se colocan uno tras otro y pasan al siguiente tramo
 * cuando ya no caben. Forma libre: cada mueble va donde diga su `ubicacion`; los que aún
 * no tienen una se colocan como en la forma lineal (y desde ahí se pueden arrastrar).
 */

export const PROFUNDIDAD_BASE = 0.6
export const ALTURA_SUPERIORES = 1.4
export const ALTURA_PARED = 2.6

/** Altura del borde inferior de las piezas que cuelgan de la pared. */
const ALTURA_COLGADO: Partial<Record<TipoMueble, number>> = {
  superior: ALTURA_SUPERIORES,
  gabinete_bano: 1.2,
  repisa: 1.5,
}

export type Capa = 'suelo' | 'alto' | 'isla'
export type Muro = 'fondo' | 'derecha' | 'izquierda' | 'isla' | 'libre'

export interface MuebleResuelto {
  /** `_id` del mueble dentro del diseño (no el del catálogo). */
  _id: string
  posicion: number
  mueble: Mueble
  medidasCm?: MedidasPieza
  ubicacion?: Ubicacion
}

export interface Colocacion {
  id: string
  mueble: Mueble
  capa: Capa
  muro: Muro
  /** Centro del mueble. */
  centro: [number, number, number]
  /** Giro sobre Y, de modo que el frente mire hacia dentro del espacio. */
  rotY: number
  ancho: number
  alto: number
  fondo: number
  /** true si el mueble no cabe en la pared o se sale del espacio. */
  desborda: boolean
}

interface Tramo {
  muro: Muro
  origen: [number, number]
  direccion: [number, number]
  normal: [number, number]
  longitud: number
  /** Los muebles de esta pared se corren hasta su final (la esquina con la pared siguiente). */
  pegarAlFinal?: boolean
}

export function tramosPara(forma: FormaCocina, { ancho, fondo }: MedidasM): Tramo[] {
  const p = PROFUNDIDAD_BASE
  const largo = (v: number) => Math.max(0.3, v)
  const paredFondo = (inicio: number, longitud: number): Tramo => ({
    muro: 'fondo', origen: [-ancho / 2 + inicio, -fondo / 2], direccion: [1, 0], normal: [0, 1], longitud: largo(longitud),
  })
  const paredDerecha: Tramo = { muro: 'derecha', origen: [ancho / 2, -fondo / 2], direccion: [0, 1], normal: [-1, 0], longitud: largo(fondo) }
  const paredIzquierda: Tramo = { muro: 'izquierda', origen: [-ancho / 2, -fondo / 2], direccion: [0, 1], normal: [1, 0], longitud: largo(fondo) }

  switch (forma) {
    case 'L':
      // El fondo se pega a la esquina para que la L sea una hilera continua.
      return [{ ...paredFondo(0, ancho - p), pegarAlFinal: true }, paredDerecha]
    case 'U':
      return [paredFondo(p, ancho - 2 * p), paredDerecha, paredIzquierda]
    default:
      return [paredFondo(0, ancho)]
  }
}

export function capaDe(tipo: TipoMueble): Capa {
  if (tipo in ALTURA_COLGADO) return 'alto'
  if (tipo === 'isla' || tipo === 'barra') return 'isla'
  return 'suelo'
}

/** Medidas finales en metros: las propias de la pieza o, si no hay, las del catálogo. */
export function medidasDe({ mueble, medidasCm }: Pick<MuebleResuelto, 'mueble' | 'medidasCm'>) {
  return {
    ancho: (medidasCm?.ancho ?? mueble.anchoCm) / 100,
    alto: (medidasCm?.alto ?? mueble.altoCm) / 100,
    fondo: (medidasCm?.fondo ?? mueble.fondoCm) / 100,
  }
}

/** Altura desde la que cuelgan las piezas de pared más bajas (gabinete de baño). */
const ALTURA_COLGADO_MINIMA = Math.min(...Object.values(ALTURA_COLGADO))

interface Cursor {
  tramo: number
  usado: number
}

/** Lleva los dos cursores a la posición del que vaya más adelante en la pared. */
function igualarAlMasAvanzado(a: Cursor, b: Cursor) {
  const adelante = a.tramo > b.tramo || (a.tramo === b.tramo && a.usado >= b.usado) ? a : b
  Object.assign(a, adelante)
  Object.assign(b, { ...adelante })
}

function alturaCentro(tipo: TipoMueble, alto: number): number {
  return (ALTURA_COLGADO[tipo] ?? 0) + alto / 2
}

export const gradosARadianes = (r: Rotacion) => (r * Math.PI) / 180

/** Giro en Y (radianes) → rotación permitida más cercana (0, 90, 180, 270). */
export function rotacionDe(rotY: number): Rotacion {
  const grados = ((((rotY * 180) / Math.PI) % 360) + 360) % 360
  return ((Math.round(grados / 90) * 90) % 360) as Rotacion
}

export interface ResultadoDistribucion {
  colocaciones: Colocacion[]
  desbordados: Colocacion[]
}

export function distribuir(forma: FormaCocina, medidas: MedidasM, muebles: MuebleResuelto[]): ResultadoDistribucion {
  const ordenados = [...muebles].sort((a, b) => a.posicion - b.posicion)

  if (forma === 'libre') {
    // Los que no tienen ubicación se reparten como en la forma lineal.
    const automaticos = distribuirConTramos('lineal', medidas, ordenados.filter((m) => m.ubicacion === undefined))
    const porId = new Map(automaticos.map((c) => [c.id, c]))
    const colocaciones = ordenados.flatMap((item) => {
      if (item.ubicacion !== undefined) return [colocacionLibre(item, item.ubicacion, medidas)]
      const automatica = porId.get(item._id)
      return automatica === undefined ? [] : [automatica]
    })
    return { colocaciones, desbordados: colocaciones.filter((c) => c.desborda) }
  }

  const colocaciones = distribuirConTramos(forma, medidas, ordenados)
  return { colocaciones, desbordados: colocaciones.filter((c) => c.desborda) }
}

function colocacionLibre(item: MuebleResuelto, { x, z, rotacion }: Ubicacion, medidas: MedidasM): Colocacion {
  const { ancho, alto, fondo } = medidasDe(item)
  // Con giros de 90/270 el mueble ocupa su fondo a lo ancho.
  const girado = rotacion === 90 || rotacion === 270
  const mitadX = (girado ? fondo : ancho) / 2
  const mitadZ = (girado ? ancho : fondo) / 2
  const margen = 1e-6
  const desborda =
    x - mitadX < -medidas.ancho / 2 - margen ||
    x + mitadX > medidas.ancho / 2 + margen ||
    z - mitadZ < -medidas.fondo / 2 - margen ||
    z + mitadZ > medidas.fondo / 2 + margen
  return {
    id: item._id,
    mueble: item.mueble,
    capa: capaDe(item.mueble.tipo),
    muro: 'libre',
    centro: [x, alturaCentro(item.mueble.tipo, alto), z],
    rotY: gradosARadianes(rotacion),
    ancho,
    alto,
    fondo,
    desborda,
  }
}

/**
 * Cuánto ancho de muebles le toca a cada pared, por hilera: el total se reparte en proporción
 * al largo de cada pared. Los muebles de piso altos cuentan en las dos hileras.
 */
function cuotasPorTramo(tramos: Tramo[], ordenados: MuebleResuelto[]): Record<'suelo' | 'alto', number[]> {
  const total = { suelo: 0, alto: 0 }
  for (const item of ordenados) {
    const capa = capaDe(item.mueble.tipo)
    if (capa === 'isla') continue
    const { ancho, alto } = medidasDe(item)
    total[capa] += ancho
    if (capa === 'suelo' && alto > ALTURA_COLGADO_MINIMA) total.alto += ancho
  }
  const largoTotal = tramos.reduce((suma, t) => suma + t.longitud, 0)
  const cuota = (capa: 'suelo' | 'alto') => tramos.map((t) => (total[capa] * t.longitud) / largoTotal)
  return { suelo: cuota('suelo'), alto: cuota('alto') }
}

/** Muebles que pueden formar la isla (los altos, como una alacena, se quedan en la pared). */
const PARA_ISLA: TipoMueble[] = ['inferior']

/**
 * Forma "con isla" sin una pieza de isla o barra en el diseño: los últimos muebles bajos
 * (cerca de un tercio, al menos uno) salen de la pared y forman la isla. Siempre queda al
 * menos uno en la pared. Si ya hay una isla o una barra, no se mueve nada.
 */
function elegirParaIsla(ordenados: MuebleResuelto[]): Set<string> {
  if (ordenados.some((m) => capaDe(m.mueble.tipo) === 'isla')) return new Set()
  const candidatos = ordenados.filter(
    (m) => PARA_ISLA.includes(m.mueble.tipo) && medidasDe(m).alto <= ALTURA_COLGADO_MINIMA,
  )
  if (candidatos.length < 2) return new Set()
  const cuantos = Math.max(1, Math.round(candidatos.length / 3))
  return new Set(candidatos.slice(-cuantos).map((m) => m._id))
}

function distribuirConTramos(forma: FormaCocina, medidas: MedidasM, ordenados: MuebleResuelto[]): Colocacion[] {
  const tramos = tramosPara(forma, medidas)
  const cursores = { suelo: { tramo: 0, usado: 0 }, alto: { tramo: 0, usado: 0 } }
  const aIsla = forma === 'isla' ? elegirParaIsla(ordenados) : new Set<string>()
  const cuotas = cuotasPorTramo(tramos, ordenados.filter((m) => !aIsla.has(m._id)))
  const colocaciones: Colocacion[] = []
  const islas: MuebleResuelto[] = []
  // Dónde quedó cada mueble (pared e hilera) y hasta dónde llega cada hilera en cada pared.
  const lugares: { colocacion: Colocacion; tramo: number; fila: 'suelo' | 'alto' }[] = []
  const fin = { suelo: tramos.map(() => 0), alto: tramos.map(() => 0) }

  for (const item of ordenados) {
    const capa = capaDe(item.mueble.tipo)
    if (capa === 'isla' || aIsla.has(item._id)) {
      islas.push(item)
      continue
    }
    const { ancho, alto, fondo } = medidasDe(item)
    const cursor = cursores[capa]
    // Un mueble de piso alto (alacena, biblioteca, torre) ocupa también la hilera de arriba:
    // empieza donde terminen las dos hileras y, al final, las deja a ambas después de él.
    const esAlto = capa === 'suelo' && alto > ALTURA_COLGADO_MINIMA
    if (esAlto) igualarAlMasAvanzado(cursores.suelo, cursores.alto)

    // Pasa a la siguiente pared si no cabe en lo que queda de esta, o si esta ya tiene su
    // parte del total (así en L y U los muebles se reparten por todas las paredes).
    while (
      cursor.tramo < tramos.length - 1 &&
      (cursor.usado + ancho > tramos[cursor.tramo].longitud + 1e-6 ||
        (cursor.usado > 0 && cursor.usado + ancho / 2 > cuotas[capa][cursor.tramo] + 1e-6))
    ) {
      cursor.tramo += 1
      cursor.usado = 0
    }
    const tramo = tramos[cursor.tramo]
    const desborda = cursor.usado + ancho > tramo.longitud + 1e-6
    const avance = cursor.usado + ancho / 2

    colocaciones.push({
      id: item._id,
      mueble: item.mueble,
      capa,
      muro: tramo.muro,
      centro: [
        tramo.origen[0] + tramo.direccion[0] * avance + (tramo.normal[0] * fondo) / 2,
        alturaCentro(item.mueble.tipo, alto),
        tramo.origen[1] + tramo.direccion[1] * avance + (tramo.normal[1] * fondo) / 2,
      ],
      rotY: Math.atan2(tramo.normal[0], tramo.normal[1]),
      ancho,
      alto,
      fondo,
      desborda,
    })
    lugares.push({ colocacion: colocaciones[colocaciones.length - 1], tramo: cursor.tramo, fila: capa })
    cursor.usado += ancho
    fin[capa][cursor.tramo] = Math.max(fin[capa][cursor.tramo], cursor.usado)
    if (esAlto) {
      Object.assign(cursores.alto, cursores.suelo)
      fin.alto[cursor.tramo] = Math.max(fin.alto[cursor.tramo], cursor.usado)
    }
  }

  // Paredes que se pegan a la esquina: corre cada hilera lo que le sobre hasta el final.
  for (const { colocacion, tramo: indice, fila } of lugares) {
    const tramo = tramos[indice]
    if (tramo.pegarAlFinal !== true || colocacion.desborda) continue
    const sobra = Math.max(0, tramo.longitud - fin[fila][indice])
    colocacion.centro[0] += tramo.direccion[0] * sobra
    colocacion.centro[2] += tramo.direccion[1] * sobra
  }

  // Islas y barras: una hilera centrada, separada de la pared de trabajo.
  if (islas.length > 0) {
    const tamanos = islas.map((i) => medidasDe(i))
    const total = tamanos.reduce((suma, t) => suma + t.ancho, 0)
    const fondoMax = Math.max(...tamanos.map((t) => t.fondo))
    const desborda = total > medidas.ancho - 0.2
    const zIdeal = -medidas.fondo / 2 + PROFUNDIDAD_BASE + 1 + fondoMax / 2
    const z = Math.min(zIdeal, medidas.fondo / 2 - fondoMax / 2)
    let usado = 0
    islas.forEach((item, i) => {
      const { ancho, alto, fondo } = tamanos[i]
      colocaciones.push({
        id: item._id,
        mueble: item.mueble,
        capa: 'isla',
        muro: 'isla',
        centro: [-total / 2 + usado + ancho / 2, alto / 2, z],
        rotY: Math.PI,
        ancho,
        alto,
        fondo,
        desborda,
      })
      usado += ancho
    })
  }

  return colocaciones
}
