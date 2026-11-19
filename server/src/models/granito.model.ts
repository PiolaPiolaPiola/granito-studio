import { model, Schema } from 'mongoose';

export const TIPOS_PIEDRA = ['granito', 'marmol', 'cuarzo'] as const;
export type TipoPiedra = (typeof TIPOS_PIEDRA)[number];

export const ACABADOS = ['brillante', 'mate'] as const;
export type Acabado = (typeof ACABADOS)[number];

export interface Granito {
  nombre: string;
  tipo: TipoPiedra;
  acabado: Acabado;
  /** Textura que se pinta en 3D. */
  imagenUrl: string;
  /** Foto de un trabajo real hecho con esta piedra (solo para mostrar en el catálogo). */
  fotoUrl?: string;
  /** Precio por metro cuadrado instalado, en pesos (para la cotización). */
  precioM2?: number;
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
    fotoUrl: { type: String, trim: true },
    precioM2: { type: Number, min: 0 },
    etiquetas: { type: [{ type: String, trim: true, lowercase: true }], default: [] },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

esquemaGranito.index({ nombre: 1 }, { unique: true, collation: { locale: 'es', strength: 1 } });
esquemaGranito.index({ tipo: 1, acabado: 1, creationAt: -1 });
esquemaGranito.index({ etiquetas: 1 });

export const GranitoModelo = model<Granito>('Granito', esquemaGranito);
