/**
 * Único lugar que toca `localStorage`. (El diseño de Kimi repetía este código en
 * cada pantalla.) Se usa para el token de sesión y para persistir los mocks.
 *
 * Si el almacenamiento no está disponible (modo privado, cuota llena), la app
 * sigue funcionando: simplemente no recuerda nada.
 */
export class AlmacenLocal<T> {
  private readonly clave: string

  constructor(clave: string) {
    this.clave = `granito-studio:${clave}`
  }

  leer(): T | null {
    try {
      const crudo = localStorage.getItem(this.clave)
      return crudo === null ? null : (JSON.parse(crudo) as T)
    } catch {
      return null
    }
  }

  guardar(valor: T): void {
    try {
      localStorage.setItem(this.clave, JSON.stringify(valor))
    } catch {
      // sin almacenamiento: se ignora
    }
  }

  borrar(): void {
    try {
      localStorage.removeItem(this.clave)
    } catch {
      // sin almacenamiento: se ignora
    }
  }
}

export const almacenToken = new AlmacenLocal<string>('token')
