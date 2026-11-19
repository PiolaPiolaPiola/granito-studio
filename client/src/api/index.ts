import { clienteHttp } from './clienteHttp'
import type { AuthApi, DisenosApi, GranitosApi, IaApi, MueblesApi, PublicoApi, SugerenciasApi } from './contratos'
import { AuthApiHttp } from './http/auth.http'
import { DisenosApiHttp } from './http/disenos.http'
import { GranitosApiHttp } from './http/granitos.http'
import { IaApiHttp } from './http/ia.http'
import { MueblesApiHttp } from './http/muebles.http'
import { PublicoApiHttp } from './http/publico.http'
import { SugerenciasApiHttp } from './http/sugerencias.http'

/**
 * RAÍZ DE COMPOSICIÓN: el único lugar donde se decide qué implementación usa
 * cada recurso. Las pantallas importan las constantes de abajo, tipadas con la
 * interfaz, y no saben qué hay detrás (inversión de dependencias).
 *
 * Cambiar la implementación de un recurso (por ejemplo, por datos de prueba para una demo
 * sin servidor) es cambiar UNA línea de abajo.
 */
export const authApi: AuthApi = new AuthApiHttp(clienteHttp)
export const granitosApi: GranitosApi = new GranitosApiHttp(clienteHttp)
export const mueblesApi: MueblesApi = new MueblesApiHttp(clienteHttp)
export const disenosApi: DisenosApi = new DisenosApiHttp(clienteHttp)
export const sugerenciasApi: SugerenciasApi = new SugerenciasApiHttp(clienteHttp)
export const iaApi: IaApi = new IaApiHttp(clienteHttp)
export const publicoApi: PublicoApi = new PublicoApiHttp(clienteHttp)
