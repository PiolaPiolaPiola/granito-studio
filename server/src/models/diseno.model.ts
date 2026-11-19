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

export interface Diseno {
  nombre: string;
  espacio: Espacio;
  forma: FormaCocina;
  medidasM: { ancho: number; fondo: number };
  acabados: AcabadosMeson;
  muebles: MuebleEnDiseno[];
  materiales: MaterialAsignado[];
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
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

esquemaDiseno.index({ updatedAt: -1 });

export const DisenoModelo = model<Diseno>('Diseno', esquemaDiseno);
