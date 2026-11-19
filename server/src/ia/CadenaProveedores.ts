import { AppError } from '../errors/AppError.js';
import { ErrorProveedorIa, type PeticionIa, type ProveedorIa } from './proveedor.js';

export interface RespuestaCadena {
  datos: unknown;
  proveedor: string;
}

/**
 * Cadena de responsabilidad sobre varios proveedores gratuitos: prueba en orden y, si uno
 * falla (cuota agotada, caído, respuesta inválida), pasa al siguiente. Al que falla lo
 * "pausa" el tiempo que corresponda para no seguir gastando peticiones en él.
 */
export class CadenaProveedores {
  /** nombre del proveedor → momento (ms) hasta el que está en pausa. */
  private readonly pausados = new Map<string, number>();

  constructor(
    private readonly proveedores: ProveedorIa[],
    private readonly ahora: () => number = Date.now,
  ) {}

  get disponible(): boolean {
    return this.proveedores.length > 0;
  }

  get nombres(): string[] {
    return this.proveedores.map((p) => p.nombre);
  }

  async responder(peticion: PeticionIa): Promise<RespuestaCadena> {
    if (!this.disponible) {
      throw new AppError(503, 'No hay ningún proveedor de IA configurado en el servidor');
    }

    const errores: string[] = [];
    for (const proveedor of this.proveedores) {
      const hasta = this.pausados.get(proveedor.nombre) ?? 0;
      if (hasta > this.ahora()) {
        errores.push(`${proveedor.nombre} en pausa`);
        continue;
      }
      try {
        const datos = await proveedor.responderJson(peticion);
        return { datos, proveedor: proveedor.nombre };
      } catch (error) {
        const pausa = error instanceof ErrorProveedorIa ? error.pausaMs : 0;
        if (pausa > 0) this.pausados.set(proveedor.nombre, this.ahora() + pausa);
        errores.push(error instanceof Error ? error.message : `${proveedor.nombre} falló`);
      }
    }

    console.warn(`IA sin respuesta: ${errores.join(' · ')}`);
    throw new AppError(
      503,
      'Los servicios de IA gratuitos no respondieron ahora (pueden haber agotado su cuota). Intenta en unos minutos.',
    );
  }
}
