import { clienteHttp } from './clienteHttp'
import type { AuthApi, DisenosApi, GranitosApi, MueblesApi, SugerenciasApi } from './contratos'
import { AuthApiHttp } from './http/auth.http'
import { DisenosApiHttp } from './http/disenos.http'
import { GranitosApiHttp } from './http/granitos.http'
import { MueblesApiHttp } from './http/muebles.http'
import { SugerenciasApiHttp } from './http/sugerencias.http'
import { DisenosApiMock } from './mock/disenos.mock'
import { GranitosApiMock } from './mock/granitos.mock'
import { MueblesApiMock } from './mock/muebles.mock'
import { SugerenciasApiMock } from './mock/sugerencias.mock'

/**
 * RAÍZ DE COMPOSICIÓN: el único lugar donde se decide qué implementación usa
 * cada recurso. Las pantallas importan las constantes de abajo, tipadas con la
 * interfaz, y no saben si detrás hay un mock o Axios (inversión de dependencias).
 *
 * Para pasar un recurso a la API real, cambia UNA línea:
 *   export const granitosApi: GranitosApi = mock.granitos   →   real.granitos
 */

const real = {
  auth: new AuthApiHttp(clienteHttp),
  granitos: new GranitosApiHttp(clienteHttp),
  muebles: new MueblesApiHttp(clienteHttp),
  disenos: new DisenosApiHttp(clienteHttp),
  sugerencias: new SugerenciasApiHttp(clienteHttp),
}

const mockGranitos = new GranitosApiMock()
const mock = {
  granitos: mockGranitos,
  muebles: new MueblesApiMock(),
  disenos: new DisenosApiMock(),
  sugerencias: new SugerenciasApiMock(mockGranitos),
}

// ✅ Real: el backend ya tiene login y /auth/me.
export const authApi: AuthApi = real.auth

// 🧪 Mock: el backend aún no tiene estos endpoints (B5–B9).
export const granitosApi: GranitosApi = mock.granitos
export const mueblesApi: MueblesApi = mock.muebles
export const disenosApi: DisenosApi = mock.disenos
export const sugerenciasApi: SugerenciasApi = mock.sugerencias
