import '../config/zod.js';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { almacenamiento } from '../almacenamiento/index.js';
import { conectarBaseDatos } from '../config/db.js';
import { env } from '../config/env.js';
import { DisenoModelo, type FormaCocina } from '../models/diseno.model.js';
import { GranitoModelo, type Acabado, type TipoPiedra } from '../models/granito.model.js';
import { MuebleModelo, type TipoMueble } from '../models/mueble.model.js';
import { UsuarioModelo, type Rol } from '../models/usuario.model.js';
import { hashearContrasena } from '../services/auth.service.js';
import { texturaPng, type EstiloTextura } from './texturas.js';

/*
 * Datos de ejemplo para desarrollo (los mismos del mock del frontend).
 * Uso: npm run seed            → agrega lo que falte (no duplica)
 *      npm run seed -- --reiniciar → borra granitos, muebles y diseños y los vuelve a crear
 */

interface GranitoSemilla {
  nombre: string;
  tipo: TipoPiedra;
  acabado: Acabado;
  etiquetas: string[];
  base: string;
  vena: string;
  estilo: EstiloTextura;
}

const GRANITOS: GranitoSemilla[] = [
  {
    nombre: 'Negro San Gabriel',
    tipo: 'granito',
    acabado: 'brillante',
    etiquetas: ['negro', 'moderno', 'elegante'],
    base: '#141416',
    vena: '#5a5a62',
    estilo: 'grano',
  },
  {
    nombre: 'Blanco Ártico',
    tipo: 'granito',
    acabado: 'brillante',
    etiquetas: ['blanco', 'luminoso', 'moderno'],
    base: '#f1efea',
    vena: '#a9a49b',
    estilo: 'grano',
  },
  {
    nombre: 'Verde Ubatuba',
    tipo: 'granito',
    acabado: 'brillante',
    etiquetas: ['verde', 'natural'],
    base: '#1f3a1c',
    vena: '#6a9a58',
    estilo: 'grano',
  },
  {
    nombre: 'Gris Mara',
    tipo: 'granito',
    acabado: 'mate',
    etiquetas: ['gris', 'industrial'],
    base: '#86837c',
    vena: '#d2cfc8',
    estilo: 'grano',
  },
  {
    nombre: 'Beige Bahía',
    tipo: 'granito',
    acabado: 'mate',
    etiquetas: ['beige', 'cálido', 'clásico'],
    base: '#cdbd9f',
    vena: '#8d7556',
    estilo: 'grano',
  },
  {
    nombre: 'Crema Marfil',
    tipo: 'marmol',
    acabado: 'brillante',
    etiquetas: ['beige', 'clásico', 'elegante'],
    base: '#eadfc6',
    vena: '#bda06a',
    estilo: 'vena',
  },
  {
    nombre: 'Carrara Blanco',
    tipo: 'marmol',
    acabado: 'mate',
    etiquetas: ['blanco', 'gris', 'clásico', 'veteado'],
    base: '#f3f3f1',
    vena: '#8f8f8a',
    estilo: 'vena',
  },
  {
    nombre: 'Calacatta Oro',
    tipo: 'marmol',
    acabado: 'brillante',
    etiquetas: ['blanco', 'dorado', 'veteado'],
    base: '#f7f3e9',
    vena: '#c19a4e',
    estilo: 'vena',
  },
  {
    nombre: 'Cuarzo Blanco Puro',
    tipo: 'cuarzo',
    acabado: 'mate',
    etiquetas: ['blanco', 'minimalista'],
    base: '#fbfbfa',
    vena: '#b9b9b3',
    estilo: 'liso',
  },
];

const MUEBLES: [string, TipoMueble, number, number, number][] = [
  ['Gabinete inferior 2 puertas', 'inferior', 80, 90, 60],
  ['Cajonera inferior 3 cajones', 'inferior', 40, 90, 60],
  ['Módulo para horno', 'inferior', 60, 90, 60],
  ['Módulo con tarja', 'inferior', 90, 90, 60],
  ['Gabinete superior 2 puertas', 'superior', 80, 72, 35],
  ['Gabinete superior vitrina', 'superior', 60, 72, 35],
  ['Isla central con cubierta', 'isla', 180, 95, 90],
  ['Alacena doble', 'alacena', 120, 210, 45],
  ['Alacena esquinera', 'alacena', 90, 210, 45],
];

interface DisenoSemilla {
  nombre: string;
  forma: FormaCocina;
  medidasM: { ancho: number; fondo: number };
  /** Posición en el diseño → número de mueble (1 = primero de MUEBLES). */
  muebles: number[];
  granitoMeson: number;
  colores: { posicion: number; colorHex: string }[];
}

const DISENOS: DisenoSemilla[] = [
  {
    nombre: 'Cocina apartamento modelo',
    forma: 'L',
    medidasM: { ancho: 3.4, fondo: 2.6 },
    muebles: [1, 4, 2, 3, 1, 5, 6, 5],
    granitoMeson: 1,
    colores: [
      { posicion: 1, colorHex: '#f4f1ea' },
      { posicion: 2, colorHex: '#f4f1ea' },
    ],
  },
  {
    nombre: 'Cocina casa campestre',
    forma: 'isla',
    medidasM: { ancho: 4.2, fondo: 3.6 },
    muebles: [4, 1, 3, 1, 7, 5],
    granitoMeson: 7,
    colores: [{ posicion: 5, colorHex: '#b88a5a' }],
  },
];

/** Solo para desarrollo: en producción el usuario real se crea con `npm run usuario:crear`. */
const USUARIOS: { email: string; contrasena: string; rol: Rol }[] = [
  { email: 'admin@granito.test', contrasena: 'Admin-Granito-2026', rol: 'admin' },
  { email: 'vendedor@granito.test', contrasena: 'Vendedor-Granito-2026', rol: 'vendedor' },
];

async function sembrarUsuarios() {
  for (const { email, contrasena, rol } of USUARIOS) {
    if (await UsuarioModelo.exists({ email })) continue;
    await UsuarioModelo.create({ email, rol, contrasenaHash: await hashearContrasena(contrasena) });
    console.info(`  usuario ${email} (${rol})`);
  }
}

async function sembrarGranitos() {
  const ids: mongoose.Types.ObjectId[] = [];
  for (const [indice, granito] of GRANITOS.entries()) {
    const existente = await GranitoModelo.findOne({ nombre: granito.nombre }).select('_id').lean();
    if (existente) {
      ids.push(existente._id);
      continue;
    }

    const imagenUrl = await almacenamiento.guardar(
      {
        contenido: texturaPng(granito.base, granito.vena, granito.estilo, indice + 3),
        tipo: 'image/png',
      },
      'granitos',
    );
    const { nombre, tipo, acabado, etiquetas } = granito;
    const creado = await GranitoModelo.create({ nombre, tipo, acabado, etiquetas, imagenUrl });
    ids.push(creado._id);
    console.info(`  granito ${nombre}`);
  }
  return ids;
}

async function sembrarMuebles() {
  const ids: mongoose.Types.ObjectId[] = [];
  for (const [nombre, tipo, anchoCm, altoCm, fondoCm] of MUEBLES) {
    const existente = await MuebleModelo.findOne({ nombre }).select('_id').lean();
    const mueble =
      existente ?? (await MuebleModelo.create({ nombre, tipo, anchoCm, altoCm, fondoCm }));
    if (!existente) console.info(`  mueble ${nombre}`);
    ids.push(mueble._id);
  }
  return ids;
}

async function sembrarDisenos(
  granitos: mongoose.Types.ObjectId[],
  muebles: mongoose.Types.ObjectId[],
) {
  for (const diseno of DISENOS) {
    if (await DisenoModelo.exists({ nombre: diseno.nombre })) continue;

    const mueblesEnDiseno = diseno.muebles.map((numero, indice) => ({
      _id: new mongoose.Types.ObjectId(),
      mueble: muebles[numero - 1],
      posicion: indice + 1,
    }));
    const granito = granitos[diseno.granitoMeson - 1];

    await DisenoModelo.create({
      nombre: diseno.nombre,
      forma: diseno.forma,
      medidasM: diseno.medidasM,
      muebles: mueblesEnDiseno,
      materiales: [
        { pieza: 'meson', granito },
        { pieza: 'salpicadero', granito },
        ...diseno.colores.map(({ posicion, colorHex }) => ({
          pieza: 'mueble' as const,
          muebleEnDiseno: mueblesEnDiseno[posicion - 1]?._id,
          colorHex,
        })),
      ],
    });
    console.info(`  diseño ${diseno.nombre}`);
  }
}

async function reiniciar() {
  const granitos = await GranitoModelo.find().select('imagenUrl').lean();
  await Promise.all(granitos.map(({ imagenUrl }) => almacenamiento.eliminar(imagenUrl)));
  await Promise.all([
    GranitoModelo.deleteMany({}),
    MuebleModelo.deleteMany({}),
    DisenoModelo.deleteMany({}),
  ]);
  console.info('  catálogo y diseños borrados');
}

const { values } = parseArgs({ options: { reiniciar: { type: 'boolean', default: false } } });

if (env.NODE_ENV === 'production') {
  console.error('El seed es solo para desarrollo: crea usuarios con contraseñas conocidas.');
  process.exit(1);
}

try {
  await conectarBaseDatos();
  await mongoose.connection.syncIndexes();
  if (values.reiniciar) await reiniciar();

  await sembrarUsuarios();
  const granitos = await sembrarGranitos();
  const muebles = await sembrarMuebles();
  await sembrarDisenos(granitos, muebles);
  console.info('Seed listo.');
} catch (error) {
  console.error('El seed falló:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
