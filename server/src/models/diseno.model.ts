import { model, Schema, type Types } from 'mongoose';
import { ESPACIOS, type Espacio } from './mueble.model.js';

/** `libre`: sin plantilla, cada mueble lleva su propia ubicación (x, z, giro). */
export const FORMAS_COCINA = ['lineal', 'L', 'U', 'isla', 'libre'] as const;
export type FormaCocina = (typeof FORMAS_COCINA)[number];

export const PIEZAS = ['meson', 'salpicadero', 'mueble'] as const;
export type Pieza = (typeof PIEZAS)[number];

export const SALPICADEROS = ['ninguno', 'bajo', 'completo'] as const;
export type Salpicadero = (typeof SALPICADEROS)[number];

export const ROTACIONES = [0, 90, 180, 270] as const;

/**
 * Objetos de referencia: no son muebles del taller, sirven para dar escala y contexto
 * (una taza de baño, un sofá, la nevera…). No entran en la cotización.
 */
export const TIPOS_OBJETO = [
  'sofa',
  'mesa_centro',
  'televisor',
  'alfombra',
  'comedor',
  'nevera',
  'inodoro',
  'ducha',
  'planta',
] as const;
export type TipoObjeto = (typeof TIPOS_OBJETO)[number];
export type Rotacion = (typeof ROTACIONES)[number];

/** Medidas propias de esta pieza en el diseño; lo que falte se toma del catálogo. */
export interface MedidasPieza {
  ancho?: number;
  alto?: number;
  fondo?: number;
}

/** Posición en metros (centro del mueble) y giro, solo para la forma `libre`. */
export interface Ubicacion {
  x: number;
  z: number;
  rotacion: Rotacion;
}

export interface MuebleEnDiseno {
  _id: Types.ObjectId;
  mueble: Types.ObjectId;
  posicion: number;
  medidasCm?: MedidasPieza;
  ubicacion?: Ubicacion;
}

export interface ObjetoReferencia {
  _id: Types.ObjectId;
  tipo: TipoObjeto;
  ubicacion: Ubicacion;
}

export interface MaterialAsignado {
  pieza: Pieza;
  muebleEnDiseno?: Types.ObjectId;
  granito?: Types.ObjectId;
  colorHex?: string;
}

/** Detalles del trabajo en piedra, los mismos que cobra el taller. */
export interface AcabadosMeson {
  espesorCm: number;
  salpicadero: Salpicadero;
  /** Caída en cascada: la piedra baja por el costado de islas y barras hasta el piso. */
  cascada: boolean;
}

/** Colores del cuarto, para ver si los muebles combinan con el entorno. */
export interface Entorno {
  pared?: string;
  piso?: string;
  techo?: string;
}

export interface Diseno {
  nombre: string;
  espacio: Espacio;
  forma: FormaCocina;
  medidasM: { ancho: number; fondo: number };
  acabados: AcabadosMeson;
  muebles: MuebleEnDiseno[];
  materiales: MaterialAsignado[];
  /** Puede faltar en diseños guardados antes de existir (las consultas `lean` no ponen defaults). */
  objetos?: ObjetoReferencia[];
  entorno?: Entorno;
  /** Foto del espacio real del cliente sobre la que se diseña (privada: no sale en el enlace). */
  fondoUrl?: string;
  /** Código secreto del enlace público de solo lectura (no existe si no se ha compartido). */
  codigoPublico?: string;
  /** Se muestra en la página de inicio pública (lo decide un admin). */
  destacado: boolean;
  creationAt: Date;
  updatedAt: Date;
}

const medidaCm = { type: Number, min: 1, max: 500 };
const coordenada = { type: Number, required: true, min: -20, max: 20 };

const esquemaMuebleEnDiseno = new Schema<MuebleEnDiseno>({
  mueble: { type: Schema.Types.ObjectId, ref: 'Mueble', required: true },
  posicion: { type: Number, required: true, min: 1 },
  medidasCm: {
    type: new Schema<MedidasPieza>(
      { ancho: medidaCm, alto: medidaCm, fondo: medidaCm },
      { _id: false },
    ),
  },
  ubicacion: {
    type: new Schema<Ubicacion>(
      {
        x: coordenada,
        z: coordenada,
        rotacion: { type: Number, enum: ROTACIONES, required: true, default: 0 },
      },
      { _id: false },
    ),
  },
});

const esquemaUbicacion = new Schema<Ubicacion>(
  {
    x: coordenada,
    z: coordenada,
    rotacion: { type: Number, enum: ROTACIONES, required: true, default: 0 },
  },
  { _id: false },
);

const esquemaObjeto = new Schema<ObjetoReferencia>({
  tipo: { type: String, enum: TIPOS_OBJETO, required: true },
  ubicacion: { type: esquemaUbicacion, required: true },
});

const esquemaMaterial = new Schema<MaterialAsignado>(
  {
    pieza: { type: String, enum: PIEZAS, required: true },
    muebleEnDiseno: { type: Schema.Types.ObjectId },
    granito: { type: Schema.Types.ObjectId, ref: 'Granito' },
    colorHex: { type: String, match: /^#[0-9a-f]{6}$/i },
  },
  { _id: false },
);

const esquemaAcabados = new Schema<AcabadosMeson>(
  {
    espesorCm: { type: Number, required: true, min: 1, max: 10, default: 3 },
    salpicadero: { type: String, enum: SALPICADEROS, required: true, default: 'bajo' },
    cascada: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const medidaM = { type: Number, required: true, min: 0.5, max: 20 };

const esquemaDiseno = new Schema<Diseno>(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 80 },
    espacio: { type: String, enum: ESPACIOS, required: true, default: 'cocina' },
    forma: { type: String, enum: FORMAS_COCINA, required: true },
    medidasM: { ancho: medidaM, fondo: medidaM },
    acabados: { type: esquemaAcabados, default: () => ({}) },
    muebles: { type: [esquemaMuebleEnDiseno], default: [] },
    materiales: { type: [esquemaMaterial], default: [] },
    objetos: { type: [esquemaObjeto], default: [] },
    entorno: {
      type: new Schema<Entorno>(
        {
          pared: { type: String, match: /^#[0-9a-f]{6}$/i },
          piso: { type: String, match: /^#[0-9a-f]{6}$/i },
          techo: { type: String, match: /^#[0-9a-f]{6}$/i },
        },
        { _id: false },
      ),
    },
    fondoUrl: { type: String, trim: true },
    codigoPublico: { type: String },
    destacado: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

esquemaDiseno.index({ updatedAt: -1 });
// `sparse`: muchos diseños no tienen código y no chocan entre sí.
esquemaDiseno.index({ codigoPublico: 1 }, { unique: true, sparse: true });
esquemaDiseno.index({ destacado: 1, updatedAt: -1 });

export const DisenoModelo = model<Diseno>('Diseno', esquemaDiseno);
