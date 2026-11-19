import { z } from 'zod';
import { FORMAS_COCINA, SALPICADEROS, TIPOS_OBJETO } from '../models/diseno.model.js';
import { ACABADOS, TIPOS_PIEDRA } from '../models/granito.model.js';
import { ESPACIOS, MATERIALES_MUEBLE, TIPOS_MUEBLE } from '../models/mueble.model.js';

/*
 * Instrucciones (prompts) y esquemas de lo que se le pide a la IA. Las instrucciones son
 * cortas y piden SOLO JSON: menos tokens de entrada y de salida en los planes gratuitos.
 * Lo que responde el modelo se valida con zod: un campo raro se descarta (`.catch`), no
 * rompe la respuesta.
 */

/** Sube este número si cambias una instrucción: así no se reutilizan respuestas viejas. */
export const VERSION_INSTRUCCIONES = 3;

const opcional = <T extends z.ZodType>(esquema: T) => esquema.optional().catch(undefined);
const medidaCm = opcional(z.coerce.number().min(1).max(500).transform(Math.round));

export const esquemaSugerenciaMueble = z.object({
  // Se recorta a 50 (el límite de los nombres de muebles) en vez de descartarlo.
  nombre: opcional(
    z
      .string()
      .trim()
      .min(1)
      .transform((n) => n.slice(0, 50)),
  ),
  espacio: opcional(z.enum(ESPACIOS)),
  tipo: opcional(z.enum(TIPOS_MUEBLE)),
  material: opcional(z.enum(MATERIALES_MUEBLE)),
  colorHex: opcional(z.string().regex(/^#[0-9a-f]{6}$/i)),
  anchoCm: medidaCm,
  altoCm: medidaCm,
  fondoCm: medidaCm,
});

export const esquemaSugerenciaGranito = z.object({
  nombre: opcional(z.string().trim().min(1).max(80)),
  tipo: opcional(z.enum(TIPOS_PIEDRA)),
  acabado: opcional(z.enum(ACABADOS)),
  etiquetas: opcional(
    z
      .array(z.string().trim().toLowerCase().min(1).max(30))
      .max(8)
      .transform((lista) => [...new Set(lista)]),
  ),
});

export const INSTRUCCIONES_MUEBLE = `Eres experto en carpintería de cocinas, baños y salas en Colombia.
Mira la foto del mueble y responde SOLO un objeto JSON con estas claves (omite las que no sepas):
nombre (corto, en español), espacio (${ESPACIOS.join('|')}), tipo (${TIPOS_MUEBLE.join('|')}),
material (${MATERIALES_MUEBLE.join('|')}), colorHex (color principal del acabado, #rrggbb),
anchoCm, altoCm, fondoCm (medidas estimadas en centímetros, números).`;

export const INSTRUCCIONES_GRANITO = `Eres experto en piedras para mesones (granito, mármol, cuarzo) en Colombia.
Mira la foto y responde SOLO un objeto JSON con estas claves (omite las que no sepas):
nombre (nombre comercial probable, p. ej. "Negro Estelar" o "Calacatta Oro"),
tipo (${TIPOS_PIEDRA.join('|')}), acabado (${ACABADOS.join('|')}),
etiquetas (hasta 6 palabras en minúscula y sin tildes: color, estilo y si tiene "destellos" o es "veteado").`;

// --- Comandos de voz -------------------------------------------------------------------

/**
 * Acciones que el editor sabe aplicar. Los muebles y piedras van por NOMBRE: el
 * frontend los busca en su catálogo (así la IA no tiene que conocer ids).
 */
export const esquemaAccion = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('agregar'),
    mueble: z.string().min(1).max(80),
    cantidad: z.coerce.number().int().min(1).max(10).default(1),
    anchoCm: medidaCm,
  }),
  z.object({ tipo: z.literal('quitar'), mueble: opcional(z.string().min(1).max(80)) }),
  z.object({ tipo: z.literal('forma'), forma: z.enum(FORMAS_COCINA) }),
  z.object({ tipo: z.literal('espacio'), espacio: z.enum(ESPACIOS) }),
  z.object({
    tipo: z.literal('medidas'),
    ancho: opcional(z.coerce.number().min(0.5).max(20)),
    fondo: opcional(z.coerce.number().min(0.5).max(20)),
  }),
  z.object({
    tipo: z.literal('piedra'),
    piedra: z.string().min(1).max(80),
    pieza: z.enum(['meson', 'salpicadero', 'ambos']).default('ambos'),
  }),
  z.object({ tipo: z.literal('salpicadero'), valor: z.enum(SALPICADEROS) }),
  z.object({ tipo: z.literal('cascada'), valor: z.boolean() }),
  z.object({ tipo: z.literal('espesor'), valor: z.coerce.number().min(1).max(10) }),
  z.object({ tipo: z.literal('colorMuebles'), color: z.string().min(1).max(40) }),
  z.object({
    tipo: z.literal('entorno'),
    parte: z.enum(['pared', 'piso', 'techo']),
    color: z.string().min(1).max(40),
  }),
  z.object({
    tipo: z.literal('objeto'),
    objeto: z.enum(TIPOS_OBJETO),
    quitar: opcional(z.boolean()),
  }),
]);

/** Se quedan solo las acciones válidas (una acción rara no tumba las demás). */
export const esquemaRespuestaComando = z.object({
  acciones: z
    .array(z.unknown())
    .max(20)
    .catch([])
    .transform((lista) =>
      lista.flatMap((accion) => {
        const resultado = esquemaAccion.safeParse(accion);
        return resultado.success ? [resultado.data] : [];
      }),
    ),
});

export type AccionVoz = z.infer<typeof esquemaAccion>;

/**
 * Foto de un espacio real → acciones para armarlo en 3D. Se le pide al modelo que nombre
 * los muebles y la piedra con los nombres del catálogo, así el editor los encuentra.
 */
export function instruccionesEspacio(contexto: {
  espacio: string;
  muebles: string[];
  piedras: string[];
}): string {
  return `${instruccionesComando(contexto)}
TAREA: mira la FOTO de un espacio real (cocina, baño o sala) y devuelve las acciones para reconstruirlo:
1) {"tipo":"espacio"} y {"tipo":"forma"} que mejor lo describan;
2) {"tipo":"medidas"} con el ancho y el fondo del CUARTO completo en metros (no del mesón; el fondo suele ser de 2 a 4 m);
3) un {"tipo":"agregar"} por cada mueble visible (de izquierda a derecha, primero los de piso y luego los de pared), con el nombre del catálogo más parecido y su anchoCm estimado;
4) {"tipo":"piedra","pieza":"ambos"} con la piedra del catálogo más parecida al mesón, y {"tipo":"salpicadero"} si se ve;
5) {"tipo":"colorMuebles"} con el color de los muebles en #rrggbb;
6) {"tipo":"entorno"} para pared, piso y techo en #rrggbb;
7) {"tipo":"objeto"} por cada objeto de referencia visible (nevera, taza de baño, ducha, sofá…).`;
}

export function instruccionesComando(contexto: {
  espacio: string;
  muebles: string[];
  piedras: string[];
}): string {
  return `Eres el asistente de un configurador 3D de ${contexto.espacio === 'bano' ? 'baños' : contexto.espacio === 'sala' ? 'salas' : 'cocinas'}.
Convierte la orden del usuario en acciones y responde SOLO {"acciones": [...]}. Cada acción es una de:
{"tipo":"agregar","mueble":<nombre del catálogo>,"cantidad":n,"anchoCm":n?}
{"tipo":"quitar","mueble":<nombre>?} (sin mueble = el último)
{"tipo":"forma","forma":"${FORMAS_COCINA.join('|')}"}
{"tipo":"espacio","espacio":"${ESPACIOS.join('|')}"}
{"tipo":"medidas","ancho":metros,"fondo":metros}
{"tipo":"piedra","piedra":<nombre del catálogo>,"pieza":"meson|salpicadero|ambos"}
{"tipo":"salpicadero","valor":"${SALPICADEROS.join('|')}"}
{"tipo":"cascada","valor":true|false}
{"tipo":"espesor","valor":cm}
{"tipo":"colorMuebles","color":<nombre de color o #rrggbb>}
{"tipo":"entorno","parte":"pared|piso|techo","color":<nombre de color o #rrggbb>}
{"tipo":"objeto","objeto":"${TIPOS_OBJETO.join('|')}","quitar":true?} (objetos de referencia: sofá, taza de baño…)
Muebles del catálogo: ${contexto.muebles.join('; ') || 'ninguno'}.
Piedras del catálogo: ${contexto.piedras.join('; ') || 'ninguna'}.
Usa nombres exactos del catálogo. Si no entiendes la orden, responde {"acciones": []}.`;
}
