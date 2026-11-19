import type { FormaCocina } from '../models/diseno.model.js';
import type { Granito, TipoPiedra } from '../models/granito.model.js';
import type { ConId } from '../repositories/repositorio.js';
import type { ContextoSugerencia, EstrategiaSugerencias, Sugerencia } from './estrategia.js';

interface ReglaEstilo {
  estilo: string;
  /** Etiquetas de granito que encajan con el estilo (sin tildes, en minúsculas). */
  etiquetas: string[];
  /** Tipo de piedra que suma un punto extra. */
  tipoPreferido?: TipoPiedra;
  /** Formas de cocina donde el estilo luce más (suma un punto). */
  formasIdeales: FormaCocina[];
  colorMueblesHex: string;
  nombreColor: string;
}

export const REGLAS_ESTILO: ReglaEstilo[] = [
  {
    estilo: 'Moderno',
    etiquetas: ['oscuro', 'negro', 'gris', 'moderno', 'minimalista', 'uniforme'],
    tipoPreferido: 'cuarzo',
    formasIdeales: ['isla', 'U'],
    colorMueblesHex: '#f4f1ea',
    nombreColor: 'blanco hueso',
  },
  {
    estilo: 'Clásico',
    etiquetas: ['veteado', 'vetas', 'clasico', 'elegante', 'marmol'],
    tipoPreferido: 'marmol',
    formasIdeales: ['U', 'L'],
    colorMueblesHex: '#2f3e46',
    nombreColor: 'azul petróleo',
  },
  {
    estilo: 'Nórdico',
    etiquetas: ['claro', 'blanco', 'luminoso', 'nordico', 'crema'],
    formasIdeales: ['lineal', 'L'],
    colorMueblesHex: '#c8a97e',
    nombreColor: 'roble claro',
  },
  {
    estilo: 'Rústico',
    etiquetas: ['calido', 'beige', 'cafe', 'marron', 'dorado', 'rustico'],
    tipoPreferido: 'granito',
    formasIdeales: ['L', 'isla'],
    colorMueblesHex: '#5b3a29',
    nombreColor: 'nogal',
  },
];

const MAXIMO_SUGERENCIAS = 4;

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

const NOMBRE_TIPO: Record<TipoPiedra, string> = {
  granito: 'granito',
  marmol: 'mármol',
  cuarzo: 'cuarzo',
};
const FORMA_EN_TEXTO: Record<FormaCocina, string> = {
  lineal: 'lineal',
  L: 'en L',
  U: 'en U',
  isla: 'con isla',
};

/** "mármol Carrara Blanco", pero "Cuarzo Blanco Puro" (sin repetir "cuarzo" si ya está en el nombre). */
function describirPiedra({ tipo, nombre }: Pick<Granito, 'tipo' | 'nombre'>): string {
  const tipoTexto = NOMBRE_TIPO[tipo];
  return normalizar(nombre).startsWith(normalizar(tipoTexto)) ? nombre : `${tipoTexto} ${nombre}`;
}

/** Puntaje de un granito para un estilo: etiquetas en común + tipo + forma. */
function puntuar(granito: ConId<Granito>, regla: ReglaEstilo, forma: FormaCocina): number {
  const coincidencias = granito.etiquetas.filter((etiqueta) =>
    regla.etiquetas.includes(normalizar(etiqueta)),
  ).length;
  if (coincidencias === 0) return 0;

  const puntoTipo = granito.tipo === regla.tipoPreferido ? 1 : 0;
  const puntoForma = regla.formasIdeales.includes(forma) ? 1 : 0;
  return coincidencias * 2 + puntoTipo + puntoForma;
}

/**
 * Primera estrategia: reglas fijas por etiquetas. Para cada estilo busca el granito que
 * mejor encaja, sin repetir granitos entre estilos, y ordena por puntaje.
 */
export class ReglasPorEtiquetas implements EstrategiaSugerencias {
  constructor(private readonly reglas: ReglaEstilo[] = REGLAS_ESTILO) {}

  sugerir({ forma, granitoActualId }: ContextoSugerencia, catalogo: ConId<Granito>[]) {
    const candidatos = catalogo.filter(
      ({ _id }) => _id.toString() !== granitoActualId?.toLowerCase(),
    );
    const usados = new Set<string>();
    const resultado: { sugerencia: Sugerencia; puntaje: number }[] = [];

    const porPuntaje = this.reglas
      .map((regla) => ({
        regla,
        ranking: candidatos
          .map((granito) => ({ granito, puntaje: puntuar(granito, regla, forma) }))
          .filter(({ puntaje }) => puntaje > 0)
          .sort((a, b) => b.puntaje - a.puntaje),
      }))
      .sort((a, b) => (b.ranking[0]?.puntaje ?? 0) - (a.ranking[0]?.puntaje ?? 0));

    for (const { regla, ranking } of porPuntaje) {
      const mejor = ranking.find(({ granito }) => !usados.has(granito._id.toString()));
      if (!mejor) continue;

      usados.add(mejor.granito._id.toString());
      resultado.push({
        sugerencia: this.armar(regla, mejor.granito, forma),
        puntaje: mejor.puntaje,
      });
    }

    const sugerencias = resultado
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, MAXIMO_SUGERENCIAS)
      .map(({ sugerencia }) => sugerencia);

    const [masReciente] = candidatos;
    if (sugerencias.length === 0 && masReciente) {
      sugerencias.push(this.neutra(masReciente));
    }

    return Promise.resolve(sugerencias);
  }

  private armar(regla: ReglaEstilo, granito: ConId<Granito>, forma: FormaCocina): Sugerencia {
    return {
      titulo: `${regla.estilo}: ${granito.nombre} con muebles ${regla.nombreColor}`,
      descripcion: `Para una cocina ${FORMA_EN_TEXTO[forma]}, el ${describirPiedra(granito)} (${granito.acabado}) combina con muebles ${regla.nombreColor} y da un estilo ${regla.estilo.toLowerCase()}.`,
      estilo: regla.estilo,
      granitoId: granito._id.toString(),
      colorMueblesHex: regla.colorMueblesHex,
    };
  }

  /** Si ningún granito tiene etiquetas que encajen, se propone una combinación segura. */
  private neutra(granito: ConId<Granito>): Sugerencia {
    return {
      titulo: `Neutro: ${granito.nombre} con muebles blancos`,
      descripcion: `El blanco combina con cualquier piedra. Agrega etiquetas a los granitos (claro, oscuro, veteado…) para recibir sugerencias más precisas.`,
      estilo: 'Neutro',
      granitoId: granito._id.toString(),
      colorMueblesHex: '#ffffff',
    };
  }
}
