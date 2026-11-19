import { model, Schema } from 'mongoose';

/** Espacio de la casa donde va el mueble (y el diseño). */
export const ESPACIOS = ['cocina', 'sala', 'bano'] as const;
export type Espacio = (typeof ESPACIOS)[number];

export const TIPOS_MUEBLE = [
  'inferior',
  'superior',
  'isla',
  'alacena',
  'barra',
  'repisa',
  'lavamanos',
  'gabinete_bano',
  'mueble_tv',
  'biblioteca',
  'aparador',
] as const;
export type TipoMueble = (typeof TIPOS_MUEBLE)[number];

/** Qué tipos tienen sentido en cada espacio (la API rechaza combinaciones raras). */
export const TIPOS_POR_ESPACIO: Record<Espacio, readonly TipoMueble[]> = {
  cocina: ['inferior', 'superior', 'isla', 'alacena', 'barra', 'repisa'],
  bano: ['lavamanos', 'gabinete_bano', 'alacena', 'repisa'],
  sala: ['mueble_tv', 'biblioteca', 'aparador', 'barra', 'repisa'],
};

export function tipoPermitido(espacio: Espacio, tipo: TipoMueble): boolean {
  return TIPOS_POR_ESPACIO[espacio].includes(tipo);
}

/** Material del cuerpo del mueble: cambia cómo se ve en 3D (veta, brillo metálico, laca). */
export const MATERIALES_MUEBLE = ['madera', 'metal', 'lacado'] as const;
export type MaterialMueble = (typeof MATERIALES_MUEBLE)[number];

export interface Mueble {
  nombre: string;
  espacio: Espacio;
  tipo: TipoMueble;
  material: MaterialMueble;
  /** Color por defecto del acabado (el diseño puede cambiarlo). */
  colorHex?: string;
  anchoCm: number;
  altoCm: number;
  fondoCm: number;
  /** Foto del mueble real: se muestra en el catálogo y en el frente del mueble en 3D. */
  imagenUrl?: string;
  active: boolean;
  creationAt: Date;
  updatedAt: Date;
}

const medidaCm = { type: Number, required: true, min: 1, max: 500 };

const esquemaMueble = new Schema<Mueble>(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 50 },
    espacio: { type: String, enum: ESPACIOS, required: true, default: 'cocina' },
    tipo: { type: String, enum: TIPOS_MUEBLE, required: true },
    material: { type: String, enum: MATERIALES_MUEBLE, required: true, default: 'madera' },
    colorHex: { type: String, match: /^#[0-9a-f]{6}$/i },
    anchoCm: medidaCm,
    altoCm: medidaCm,
    fondoCm: medidaCm,
    imagenUrl: { type: String, trim: true },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: { createdAt: 'creationAt', updatedAt: 'updatedAt' },
    versionKey: false,
  },
);

esquemaMueble.index({ espacio: 1, tipo: 1, creationAt: -1 });

export const MuebleModelo = model<Mueble>('Mueble', esquemaMueble);
