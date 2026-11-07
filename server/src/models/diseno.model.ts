import { model, Schema, type Types } from 'mongoose';

export const FORMAS_COCINA = ['lineal', 'L', 'U', 'isla'] as const;
export type FormaCocina = (typeof FORMAS_COCINA)[number];

export const PIEZAS = ['meson', 'salpicadero', 'mueble'] as const;
export type Pieza = (typeof PIEZAS)[number];

export interface MuebleEnDiseno {
  _id: Types.ObjectId;
  mueble: Types.ObjectId;
  posicion: number;
}

export interface MaterialAsignado {
  pieza: Pieza;
  muebleEnDiseno?: Types.ObjectId;
  granito?: Types.ObjectId;
  colorHex?: string;
}

export interface Diseno {
  nombre: string;
  forma: FormaCocina;
  medidasM: { ancho: number; fondo: number };
  muebles: MuebleEnDiseno[];
  materiales: MaterialAsignado[];
  creationAt: Date;
  updatedAt: Date;
}

const esquemaMuebleEnDiseno = new Schema<MuebleEnDiseno>({
  mueble: { type: Schema.Types.ObjectId, ref: 'Mueble', required: true },
  posicion: { type: Number, required: true, min: 1 },
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

const medidaM = { type: Number, required: true, min: 0.5, max: 20 };

const esquemaDiseno = new Schema<Diseno>(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 80 },
    forma: { type: String, enum: FORMAS_COCINA, required: true },
    medidasM: { ancho: medidaM, fondo: medidaM },
    muebles: { type: [esquemaMuebleEnDiseno], default: [] },
    materiales: { type: [esquemaMaterial], default: [] },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

export const DisenoModelo = model<Diseno>('Diseno', esquemaDiseno);
