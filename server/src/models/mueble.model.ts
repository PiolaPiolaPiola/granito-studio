import { model, Schema } from 'mongoose';

export const TIPOS_MUEBLE = ['inferior', 'superior', 'isla', 'alacena'] as const;
export type TipoMueble = (typeof TIPOS_MUEBLE)[number];

export interface Mueble {
  nombre: string;
  tipo: TipoMueble;
  anchoCm: number;
  altoCm: number;
  fondoCm: number;
  miniaturaUrl?: string;
  active: boolean;
  creationAt: Date;
  updatedAt: Date;
}

const medidaCm = { type: Number, required: true, min: 1, max: 500 };

const esquemaMueble = new Schema<Mueble>(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 80 },
    tipo: { type: String, enum: TIPOS_MUEBLE, required: true },
    anchoCm: medidaCm,
    altoCm: medidaCm,
    fondoCm: medidaCm,
    miniaturaUrl: { type: String, trim: true },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

export const MuebleModelo = model<Mueble>('Mueble', esquemaMueble);
