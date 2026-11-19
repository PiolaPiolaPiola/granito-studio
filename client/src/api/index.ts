import { clienteHttp } from './clienteHttp'
import type { AuthApi, DisenosApi, GranitosApi, MueblesApi, SugerenciasApi } from './contratos'
import { AuthApiHttp } from './http/auth.http'
import { DisenosApiHttp } from './http/disenos.http'
import { GranitosApiHttp } from './http/granitos.http'
import { MueblesApiHttp } from './http/muebles.http'
import { SugerenciasApiHttp } from './http/sugerencias.http'

/**
 * RAÍZ DE COMPOSICIÓN: el único lugar donde se decide qué implementación usa
 * cada recurso. Las pantallas importan las constantes de abajo, tipadas con la
 * interfaz, y no saben si detrás hay un mock o Axios (inversión de dependencias).
 *
 * Cambiar la implementación de un recurso es cambiar UNA línea de abajo.
 */

const real = {
  auth: new AuthApiHttp(clienteHttp),
  granitos: new GranitosApiHttp(clienteHttp),
  muebles: new MueblesApiHttp(clienteHttp),
  disenos: new DisenosApiHttp(clienteHttp),
  sugerencias: new SugerenciasApiHttp(clienteHttp),
}

// ✅ Todo contra el backend real (F3). Los mocks siguen en `api/mock/` por si se necesita una demo
// sin servidor: se importan aquí y se cambia `real.x` por la instancia del mock.
export const authApi: AuthApi = real.auth
export const granitosApi: GranitosApi = real.granitos
export const mueblesApi: MueblesApi = real.muebles
export const disenosApi: DisenosApi = real.disenos
export const sugerenciasApi: SugerenciasApi = real.sugerencias
