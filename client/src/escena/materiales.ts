import type { MaterialAsignado, Pieza } from '../dominio/diseno'
import type { Acabado, Granito } from '../dominio/granito'

/** Material ya resuelto: el granito completo (no solo el id) o un color liso. */
export interface MaterialResuelto {
  granito?: Granito
  colorHex?: string
}

export function resolverMaterial(
  materiales: MaterialAsignado[],
  granitosPorId: Map<string, Granito>,
  pieza: Pieza,
  muebleEnDiseno?: string,
): MaterialResuelto {
  const material = materiales.find((m) => m.pieza === pieza && m.muebleEnDiseno === muebleEnDiseno)
  if (material === undefined) return {}
  return {
    granito: material.granito === undefined ? undefined : granitosPorId.get(material.granito),
    colorHex: material.colorHex,
  }
}

/** Brillante refleja la luz (rugosidad baja); mate la dispersa. */
export function propiedadesAcabado(acabado: Acabado | undefined): { roughness: number; metalness: number } {
  return acabado === 'brillante' ? { roughness: 0.18, metalness: 0.08 } : { roughness: 0.72, metalness: 0 }
}

export const COLOR_MUEBLE_POR_DEFECTO = '#e9e3d6'
export const COLOR_PIEDRA_POR_DEFECTO = '#cfcac0'
