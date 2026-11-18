import { AlmacenLocal } from '../../infra/almacenamiento'
import type { Pagina } from '../../dominio/comun'
import { ErrorApi } from '../errores'

/** Simula la latencia de red para que los estados de carga se vean como en producción. */
export const demora = (ms = 180) => new Promise<void>((resolver) => setTimeout(resolver, ms))

/**
 * "Tabla" en memoria que se guarda en localStorage. Es el equivalente mock de un
 * repositorio de Mongoose: las clases mock de cada recurso solo agregan reglas de filtro.
 */
export class Coleccion<T extends { _id: string }> {
  private readonly almacen: AlmacenLocal<T[]>
  private readonly semilla: () => T[]

  constructor(nombre: string, semilla: () => T[]) {
    this.almacen = new AlmacenLocal<T[]>(`mock:${nombre}`)
    this.semilla = semilla
  }

  todos(): T[] {
    const guardados = this.almacen.leer()
    if (guardados !== null) return guardados
    const iniciales = this.semilla()
    this.almacen.guardar(iniciales)
    return iniciales
  }

  guardar(items: T[]): void {
    this.almacen.guardar(items)
  }

  buscarPorId(id: string): T {
    const item = this.todos().find((i) => i._id === id)
    if (item === undefined) throw new ErrorApi('No se encontró el recurso', 404)
    return item
  }

  agregar(item: T): T {
    this.guardar([item, ...this.todos()])
    return item
  }

  reemplazar(id: string, item: T): T {
    this.buscarPorId(id)
    this.guardar(this.todos().map((i) => (i._id === id ? item : i)))
    return item
  }

  quitar(id: string): void {
    this.buscarPorId(id)
    this.guardar(this.todos().filter((i) => i._id !== id))
  }
}

export function paginar<T>(items: T[], pagina = 1, limite = 12): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(items.length / limite))
  const actual = Math.min(Math.max(1, pagina), totalPaginas)
  return {
    items: items.slice((actual - 1) * limite, actual * limite),
    total: items.length,
    pagina: actual,
    totalPaginas,
  }
}

export function leerComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(String(lector.result))
    lector.onerror = () => rechazar(new ErrorApi('No se pudo leer la imagen', 0))
    lector.readAsDataURL(archivo)
  })
}

export const ahora = () => new Date().toISOString()
