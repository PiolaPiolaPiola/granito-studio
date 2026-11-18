import type { Pagina } from '../dominio/comun'
import type { Diseno, EntradaDiseno } from '../dominio/diseno'
import type { EntradaGranito, FiltrosGranitos, Granito } from '../dominio/granito'
import type { EntradaMueble, FiltrosMuebles, Mueble } from '../dominio/mueble'
import type { ContextoSugerencia, Sugerencia } from '../dominio/sugerencia'
import type { SesionIniciada, Usuario } from '../dominio/usuario'

/**
 * Contratos de acceso a datos (patrón Repository / Puerto-Adaptador).
 *
 * Las pantallas dependen SOLO de estas interfaces (principio de inversión de
 * dependencias). Cada una tiene dos implementaciones intercambiables:
 *   - `api/mock/*`  → datos en memoria (persistidos en localStorage)
 *   - `api/http/*`  → Axios contra el backend real
 * El cambio de una a otra ocurre en un solo archivo: `api/index.ts`.
 */

export interface AuthApi {
  ingresar(email: string, contrasena: string): Promise<SesionIniciada>
  yo(): Promise<Usuario>
}

export interface GranitosApi {
  listar(filtros: FiltrosGranitos): Promise<Pagina<Granito>>
  obtener(id: string): Promise<Granito>
  /** La imagen es obligatoria al crear (el backend la recibe como multipart). */
  crear(datos: EntradaGranito, imagen: File): Promise<Granito>
  actualizar(id: string, datos: Partial<EntradaGranito>, imagen?: File): Promise<Granito>
  /** Borrado lógico: el granito queda `active: false`. */
  desactivar(id: string): Promise<void>
}

export interface MueblesApi {
  listar(filtros: FiltrosMuebles): Promise<Pagina<Mueble>>
  obtener(id: string): Promise<Mueble>
  crear(datos: EntradaMueble): Promise<Mueble>
  actualizar(id: string, datos: Partial<EntradaMueble>): Promise<Mueble>
  desactivar(id: string): Promise<void>
}

export interface DisenosApi {
  listar(): Promise<Diseno[]>
  obtener(id: string): Promise<Diseno>
  crear(datos: EntradaDiseno): Promise<Diseno>
  /** PUT: reemplaza el diseño completo, no es un parche. */
  reemplazar(id: string, datos: EntradaDiseno): Promise<Diseno>
  eliminar(id: string): Promise<void>
  duplicar(id: string): Promise<Diseno>
}

export interface SugerenciasApi {
  sugerir(contexto: ContextoSugerencia): Promise<Sugerencia[]>
}
