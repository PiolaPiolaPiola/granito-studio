import type { Pagina } from '../dominio/comun'
import type { Diseno, EntradaDiseno, FormaCocina, MedidasM } from '../dominio/diseno'
import type { EntradaGranito, FiltrosGranitos, Granito } from '../dominio/granito'
import type { EntradaMueble, Espacio, FiltrosMuebles, Mueble } from '../dominio/mueble'
import type { ContextoSugerencia, Sugerencia } from '../dominio/sugerencia'
import type { SesionIniciada, Usuario } from '../dominio/usuario'
import type {
  AccionVoz,
  ContextoComando,
  EstadoIa,
  RespuestaIa,
  SugerenciaGranito,
  SugerenciaMueble,
} from '../ia/tipos'

/**
 * Contratos de acceso a datos (patrón Repository / Puerto-Adaptador).
 *
 * Las pantallas dependen SOLO de estas interfaces (principio de inversión de
 * dependencias). La implementación actual es `api/http/*` (Axios contra el backend);
 * cambiarla (por ejemplo, por datos de prueba) se hace en un solo archivo: `api/index.ts`.
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

/** Cambios de la foto al editar un mueble: una nueva, o quitar la actual. */
export interface CambiosFotoMueble {
  imagen?: File
  quitarImagen?: boolean
}

export interface MueblesApi {
  listar(filtros: FiltrosMuebles): Promise<Pagina<Mueble>>
  obtener(id: string): Promise<Mueble>
  /** La foto es opcional: sin foto, el mueble se dibuja con su material y color. */
  crear(datos: EntradaMueble, imagen?: File): Promise<Mueble>
  actualizar(id: string, datos: Partial<EntradaMueble>, foto?: CambiosFotoMueble): Promise<Mueble>
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
  /** Crea (o devuelve) el código del enlace público. */
  compartir(id: string): Promise<string>
  dejarDeCompartir(id: string): Promise<void>
  /** Sin sesión: lo que ve el cliente con el enlace. */
  verPublico(codigo: string): Promise<DisenoPublico>
  /** Solo admin: mostrar (o no) el diseño en la página de inicio. Destacar también lo comparte. */
  destacar(id: string, destacado: boolean): Promise<{ destacado: boolean; codigoPublico?: string }>
}

/** Un diseño de la página de inicio: lo mínimo para listarlo. */
export interface DisenoDestacado {
  nombre: string
  espacio: Espacio
  forma: FormaCocina
  medidasM: MedidasM
  cantidadMuebles: number
  codigoPublico: string
}

/** Lo que ve cualquiera sin iniciar sesión. */
export interface PublicoApi {
  destacados(): Promise<DisenoDestacado[]>
  /** Catálogo activo, sin precios. */
  piedras(): Promise<Granito[]>
}

/** Un diseño compartido con lo justo para dibujarlo (sin precios ni datos internos). */
export interface DisenoPublico {
  diseno: Diseno
  muebles: Mueble[]
  granitos: Granito[]
}

export interface SugerenciasApi {
  sugerir(contexto: ContextoSugerencia): Promise<Sugerencia[]>
}

/** IA opcional del servidor (proveedores gratuitos en cadena, con caché). */
export interface IaApi {
  estado(): Promise<EstadoIa>
  analizarFoto<T extends 'mueble' | 'granito'>(
    tipo: T,
    imagen: Blob,
  ): Promise<RespuestaIa & { sugerencia: T extends 'mueble' ? SugerenciaMueble : SugerenciaGranito }>
  interpretar(texto: string, contexto: ContextoComando): Promise<RespuestaIa & { acciones: AccionVoz[] }>
  transcribir(audio: Blob, nombre: string): Promise<{ texto: string; proveedor: string }>
}
