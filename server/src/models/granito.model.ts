import { model, Schema } from 'mongoose';

export const TIPOS_PIEDRA = ['granito', 'marmol', 'cuarzo'] as const;
export type TipoPiedra = (typeof TIPOS_PIEDRA)[number];

export const ACABADOS = ['brillante', 'mate'] as const;
export type Acabado = (typeof ACABADOS)[number];

export interface Granito {
  nombre: string;
  tipo: TipoPiedra;
  acabado: Acabado;
  imagenUrl: string;
  etiquetas: string[];
  active: boolean;
  creationAt: Date;
  updatedAt: Date;
}

const esquemaGranito = new Schema<Granito>(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 80 },
    tipo: { type: String, enum: TIPOS_PIEDRA, required: true },
    acabado: { type: String, enum: ACABADOS, required: true },
    imagenUrl: { type: String, required: true, trim: true },
    etiquetas: { type: [{ type: String, trim: true, lowercase: true }], default: [] },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

export const GranitoModelo = model<Granito>('Granito', esquemaGranito);
