import type { ContextoSugerencia, Sugerencia } from '../../dominio/sugerencia'
import type { GranitosApi, SugerenciasApi } from '../contratos'

/** Reglas por etiqueta: "si el granito es X, combina con muebles de este color". */
const REGLAS: Record<string, { color: string; descripcion: string; estilo: string }> = {
  negro: { color: '#f4f1ea', descripcion: 'Contraste elegante: mesón negro intenso sobre gabinetes blancos mate.', estilo: 'Moderno' },
  blanco: { color: '#b88a5a', descripcion: 'Superficie luminosa que se calienta con módulos de madera en tonos miel.', estilo: 'Clásico' },
  verde: { color: '#e8e0cf', descripcion: 'Toque natural y sobrio con muebles color hueso.', estilo: 'Natural' },
  gris: { color: '#f4f1ea', descripcion: 'Aire industrial suavizado por gabinetes blancos.', estilo: 'Industrial' },
  beige: { color: '#6f7a63', descripcion: 'Base cálida con muebles verde salvia para un ambiente acogedor.', estilo: 'Cálido' },
  dorado: { color: '#5a5d62', descripcion: 'Vetas doradas sobre gabinetes gris grafito: impacto de showroom.', estilo: 'Lujo contemporáneo' },
}
const REGLA_POR_DEFECTO = { color: '#f4f1ea', descripcion: 'Combinación neutra que no compite con la piedra.', estilo: 'Neutro' }

/**
 * Sugerencias basadas en reglas por etiquetas (la misma idea que usará B9.1 en el
 * backend). Recibe la API de granitos por constructor: inyección de dependencias.
 */
export class SugerenciasApiMock implements SugerenciasApi {
  private readonly granitos: GranitosApi

  constructor(granitos: GranitosApi) {
    this.granitos = granitos
  }

  async sugerir(contexto: ContextoSugerencia): Promise<Sugerencia[]> {
    const { items } = await this.granitos.listar({ limite: 100 })
    return items
      .filter((g) => g._id !== contexto.granitoActualId)
      .slice(0, 4)
      .map((g) => {
        const clave = g.etiquetas.find((e) => e in REGLAS)
        const regla = clave === undefined ? REGLA_POR_DEFECTO : REGLAS[clave]
        return {
          titulo: `${g.nombre} + muebles ${regla.estilo.toLowerCase()}s`,
          descripcion: regla.descripcion,
          estilo: regla.estilo,
          granitoId: g._id,
          colorMueblesHex: regla.color,
        }
      })
  }
}
