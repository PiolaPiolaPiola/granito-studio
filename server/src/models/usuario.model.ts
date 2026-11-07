import { model, Schema } from 'mongoose';

export const ROLES = ['admin', 'vendedor'] as const;
export type Rol = (typeof ROLES)[number];

export interface Usuario {
  email: string;
  contrasenaHash: string;
  rol: Rol;
  active: boolean;
  creationAt: Date;
  updatedAt: Date;
}

const esquemaUsuario = new Schema<Usuario>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contrasenaHash: {
      type: String,
      required: true,
      select: false,
    },
    rol: {
      type: String,
      enum: ROLES,
      required: true,
      default: 'vendedor',
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'creationAt',
      updatedAt: 'updatedAt',
    },
    versionKey: false,
    toJSON: {
      transform: (_documento, salida) => {
        Reflect.deleteProperty(salida, 'contrasenaHash');
        return salida;
      },
    },
  },
);

export const UsuarioModelo = model<Usuario>('Usuario', esquemaUsuario);
