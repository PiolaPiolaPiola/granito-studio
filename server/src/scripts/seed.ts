import '../config/zod.js';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { almacenamiento } from '../almacenamiento/index.js';
import { conectarBaseDatos } from '../config/db.js';
import { env } from '../config/env.js';
import {
  DisenoModelo,
  type AcabadosMeson,
  type FormaCocina,
  type TipoObjeto,
  type Ubicacion,
} from '../models/diseno.model.js';
import { GranitoModelo, type Acabado, type TipoPiedra } from '../models/granito.model.js';
import {
  MuebleModelo,
  type Espacio,
  type MaterialMueble,
  type TipoMueble,
} from '../models/mueble.model.js';
import { UsuarioModelo, type Rol } from '../models/usuario.model.js';
import { hashearContrasena } from '../services/auth.service.js';
import { texturaPng, type EstiloTextura } from './texturas.js';

/*
 * Datos de ejemplo para desarrollo, sacados de las fotos de trabajos reales del taller:
 * las piedras, los acabados de muebles y los espacios (cocinas, baños, barras hacia la sala).
 *
 * Uso: npm run seed                      → agrega lo que falte (no duplica)
 *      npm run seed -- --reiniciar       → borra catálogo y diseños y los vuelve a crear
 *      npm run seed -- --fotos <carpeta> → carpeta con las fotos del taller
 *                                           (por defecto `semilla-fotos/`, que no se versiona)
 *
 * Las texturas 3D se generan por código con los colores de cada foto. Si la carpeta de fotos
 * existe, cada piedra guarda además la foto del trabajo real (se ve en el catálogo).
 */

interface GranitoSemilla {
  nombre: string;
  tipo: TipoPiedra;
  acabado: Acabado;
  etiquetas: string[];
  base: string;
  vena: string;
  estilo: EstiloTextura;
  /** Archivo de la carpeta de fotos donde se ve esta piedra instalada. */
  foto: string;
}

const GRANITOS: GranitoSemilla[] = [
  {
    nombre: 'Blanco Nieve',
    tipo: 'cuarzo',
    acabado: 'mate',
    etiquetas: ['blanco', 'minimalista', 'moderno', 'claro'],
    base: '#f2f1ee',
    vena: '#d9d8d3',
    estilo: 'liso',
    foto: '33.jpeg',
  },
  {
    nombre: 'Blanco Polar Brillante',
    tipo: 'cuarzo',
    acabado: 'brillante',
    etiquetas: ['blanco', 'luminoso', 'moderno', 'claro'],
    base: '#f4f3f0',
    vena: '#c9c8c2',
    estilo: 'destellos',
    foto: 'WhatsApp Image 2026-11-19 at 09.41.28wrewe.jpeg',
  },
  {
    nombre: 'Negro Estelar',
    tipo: 'cuarzo',
    acabado: 'brillante',
    etiquetas: ['negro', 'destellos', 'elegante', 'moderno', 'oscuro'],
    base: '#141416',
    vena: '#2a2a2e',
    estilo: 'destellos',
    foto: 'ertrett.jpeg',
  },
  {
    nombre: 'Gris Estelar',
    tipo: 'cuarzo',
    acabado: 'brillante',
    etiquetas: ['gris', 'destellos', 'moderno', 'industrial'],
    base: '#6e7073',
    vena: '#585a5d',
    estilo: 'destellos',
    foto: 'WhatsApp Image 2026-11-19 at 09.41.29sdf.jpeg',
  },
  {
    nombre: 'Gris Perla Mate',
    tipo: 'cuarzo',
    acabado: 'mate',
    etiquetas: ['gris', 'moderno', 'minimalista'],
    base: '#8c8f91',
    vena: '#9fa2a4',
    estilo: 'liso',
    foto: 'WhatsApp Image 2026-11-19 at 09.41.30dfs.jpeg',
  },
  {
    nombre: 'Gris Concreto',
    tipo: 'cuarzo',
    acabado: 'mate',
    etiquetas: ['gris', 'industrial', 'nordico', 'claro'],
    base: '#c9caca',
    vena: '#b4b5b4',
    estilo: 'liso',
    foto: '3.jpeg',
  },
  {
    nombre: 'Antracita',
    tipo: 'cuarzo',
    acabado: 'mate',
    etiquetas: ['gris', 'oscuro', 'moderno', 'elegante'],
    base: '#3a3d40',
    vena: '#4a4d50',
    estilo: 'liso',
    foto: 'WhatsApp Image 2026-11-19 at 09.41.30df.jpeg',
  },
  {
    nombre: 'Moca',
    tipo: 'cuarzo',
    acabado: 'brillante',
    etiquetas: ['cafe', 'calido', 'clasico'],
    base: '#9c8068',
    vena: '#8a705a',
    estilo: 'liso',
    foto: 'WhatsApp Image 2026-11-19 at 09.41.30ghjhhj.jpeg',
  },
  {
    nombre: 'Beige Arena',
    tipo: 'cuarzo',
    acabado: 'brillante',
    etiquetas: ['beige', 'destellos', 'calido', 'clasico'],
    base: '#d9cbb8',
    vena: '#8d7f6c',
    estilo: 'destellos',
    foto: 'tbhnyg.jpeg',
  },
  {
    nombre: 'Calacatta Oro',
    tipo: 'marmol',
    acabado: 'mate',
    etiquetas: ['blanco', 'dorado', 'veteado', 'elegante'],
    base: '#f4f0ea',
    vena: '#c7a27c',
    estilo: 'vena',
    foto: 'dsdg.jpeg',
  },
  {
    nombre: 'Carrara Blanco',
    tipo: 'marmol',
    acabado: 'brillante',
    etiquetas: ['blanco', 'gris', 'veteado', 'clasico'],
    base: '#eeedeb',
    vena: '#9a9c9e',
    estilo: 'vena',
    foto: 'fds.jpeg',
  },
  {
    nombre: 'Negro Absoluto',
    tipo: 'granito',
    acabado: 'brillante',
    etiquetas: ['negro', 'elegante', 'oscuro'],
    base: '#1a1b1d',
    vena: '#3c3d40',
    estilo: 'grano',
    foto: 'WhatsApp Image 2026-11-19 at 09.41.26.jpeg',
  },
  {
    nombre: 'Gris Sal y Pimienta',
    tipo: 'granito',
    acabado: 'brillante',
    etiquetas: ['gris', 'natural', 'rustico', 'claro'],
    base: '#a9a8a4',
    vena: '#4f4e4b',
    estilo: 'grano',
    foto: 'gf.jpeg',
  },
];

type MuebleSemilla = [
  nombre: string,
  espacio: Espacio,
  tipo: TipoMueble,
  material: MaterialMueble,
  colorHex: string,
  medidas: [ancho: number, alto: number, fondo: number],
];

/** Colores de la paleta de las fotos (los mismos de `client/src/dominio/paleta.ts`). */
const ROBLE = '#c9b49a';
const NOGAL = '#a8774e';
const PINO = '#c8893f';
const WENGUE = '#4a3f3d';
const CAOBA = '#6b3b2a';
const ANTRACITA = '#3a3d40';
const OLIVA = '#6f7559';
const GREIGE = '#cfc8bc';
const BLANCO = '#f2f1ee';
const ACERO = '#a7a9ac';
const NEGRO = '#232325';

const MUEBLES: MuebleSemilla[] = [
  // Cocina
  ['Gabinete inferior 2 puertas', 'cocina', 'inferior', 'madera', ROBLE, [80, 90, 60]],
  ['Cajonero 3 cajones', 'cocina', 'inferior', 'madera', ROBLE, [40, 90, 60]],
  ['Módulo lavaplatos', 'cocina', 'inferior', 'lacado', ANTRACITA, [90, 90, 60]],
  ['Módulo para estufa', 'cocina', 'inferior', 'lacado', ANTRACITA, [60, 90, 60]],
  ['Gabinete inferior verde oliva', 'cocina', 'inferior', 'lacado', OLIVA, [80, 90, 60]],
  ['Gabinete inferior en acero', 'cocina', 'inferior', 'metal', ACERO, [60, 90, 60]],
  ['Gabinete superior 2 puertas', 'cocina', 'superior', 'madera', NOGAL, [80, 72, 35]],
  ['Gabinete superior abierto', 'cocina', 'superior', 'madera', NOGAL, [60, 72, 35]],
  ['Alacena alta', 'cocina', 'alacena', 'lacado', GREIGE, [60, 210, 60]],
  ['Isla de listones', 'cocina', 'isla', 'madera', PINO, [180, 90, 90]],
  ['Barra península', 'cocina', 'barra', 'lacado', BLANCO, [150, 105, 45]],
  ['Repisa flotante de cocina', 'cocina', 'repisa', 'madera', NOGAL, [90, 4, 25]],
  // Baño
  ['Mueble lavamanos flotante', 'bano', 'lavamanos', 'madera', NOGAL, [80, 50, 48]],
  ['Mueble lavamanos 2 puertas', 'bano', 'lavamanos', 'lacado', BLANCO, [60, 80, 45]],
  ['Mueble lavamanos clásico', 'bano', 'lavamanos', 'madera', CAOBA, [90, 85, 55]],
  ['Gabinete con espejo', 'bano', 'gabinete_bano', 'madera', CAOBA, [60, 70, 15]],
  ['Torre de baño', 'bano', 'alacena', 'lacado', GREIGE, [40, 180, 30]],
  ['Repisa de baño', 'bano', 'repisa', 'metal', NEGRO, [60, 4, 15]],
  // Sala
  ['Mueble de TV flotante', 'sala', 'mueble_tv', 'madera', ROBLE, [180, 45, 40]],
  ['Mueble de TV con cajones', 'sala', 'mueble_tv', 'lacado', ANTRACITA, [200, 55, 45]],
  ['Biblioteca', 'sala', 'biblioteca', 'madera', NOGAL, [100, 200, 35]],
  ['Aparador', 'sala', 'aparador', 'madera', WENGUE, [150, 80, 45]],
  ['Barra divisoria', 'sala', 'barra', 'lacado', BLANCO, [180, 105, 40]],
  ['Repisa flotante de sala', 'sala', 'repisa', 'metal', NEGRO, [120, 4, 25]],
];

interface DisenoSemilla {
  nombre: string;
  espacio: Espacio;
  forma: FormaCocina;
  medidasM: { ancho: number; fondo: number };
  acabados: AcabadosMeson;
  /** Nombre del mueble y, en la forma libre, su ubicación. */
  muebles: (string | [string, Ubicacion])[];
  /** Nombre de la piedra del mesón y del salpicadero. */
  piedra: string;
  /** Objetos de referencia (sofá, taza de baño…) para dar escala. */
  objetos?: { tipo: TipoObjeto; ubicacion: Ubicacion }[];
}

const DISENOS: DisenoSemilla[] = [
  {
    nombre: 'Cocina en L negro estelar',
    espacio: 'cocina',
    forma: 'L',
    medidasM: { ancho: 3.4, fondo: 2.6 },
    acabados: { espesorCm: 3, salpicadero: 'bajo', cascada: false },
    muebles: [
      'Módulo para estufa',
      'Gabinete inferior 2 puertas',
      'Módulo lavaplatos',
      'Cajonero 3 cajones',
      'Gabinete inferior 2 puertas',
      'Gabinete superior 2 puertas',
      'Gabinete superior abierto',
      'Gabinete superior 2 puertas',
    ],
    piedra: 'Negro Estelar',
  },
  {
    nombre: 'Cocina con isla Calacatta',
    espacio: 'cocina',
    forma: 'isla',
    medidasM: { ancho: 4.2, fondo: 3.6 },
    acabados: { espesorCm: 2, salpicadero: 'completo', cascada: true },
    muebles: [
      'Alacena alta',
      'Módulo lavaplatos',
      'Gabinete inferior 2 puertas',
      'Módulo para estufa',
      'Cajonero 3 cajones',
      'Isla de listones',
      'Gabinete superior 2 puertas',
      'Gabinete superior 2 puertas',
    ],
    piedra: 'Calacatta Oro',
  },
  {
    nombre: 'Baño con lavamanos flotante',
    espacio: 'bano',
    forma: 'lineal',
    medidasM: { ancho: 2.2, fondo: 1.8 },
    acabados: { espesorCm: 3, salpicadero: 'bajo', cascada: false },
    muebles: [
      'Torre de baño',
      'Mueble lavamanos flotante',
      'Gabinete con espejo',
      'Repisa de baño',
    ],
    piedra: 'Blanco Nieve',
    objetos: [
      { tipo: 'inodoro', ubicacion: { x: 0.65, z: -0.54, rotacion: 0 } },
      { tipo: 'ducha', ubicacion: { x: -0.63, z: 0.43, rotacion: 0 } },
    ],
  },
  {
    nombre: 'Sala con barra y mueble de TV',
    espacio: 'sala',
    forma: 'libre',
    medidasM: { ancho: 4.5, fondo: 3.6 },
    acabados: { espesorCm: 3, salpicadero: 'ninguno', cascada: true },
    muebles: [
      ['Mueble de TV flotante', { x: 0, z: -1.6, rotacion: 0 }],
      ['Repisa flotante de sala', { x: 0, z: -1.65, rotacion: 0 }],
      ['Biblioteca', { x: 2.05, z: -0.2, rotacion: 270 }],
      ['Barra divisoria', { x: -0.9, z: 1.2, rotacion: 180 }],
    ],
    piedra: 'Blanco Polar Brillante',
    objetos: [
      { tipo: 'televisor', ubicacion: { x: 0, z: -1.75, rotacion: 0 } },
      { tipo: 'alfombra', ubicacion: { x: 0, z: -0.3, rotacion: 0 } },
      { tipo: 'mesa_centro', ubicacion: { x: 0, z: -0.4, rotacion: 0 } },
      { tipo: 'sofa', ubicacion: { x: 0, z: 0.55, rotacion: 180 } },
      { tipo: 'planta', ubicacion: { x: 1.9, z: 1.4, rotacion: 0 } },
    ],
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

/** Guarda la foto del trabajo real, si la carpeta de fotos la tiene. */
async function guardarFoto(carpeta: string | null, archivo: string): Promise<string | undefined> {
  if (carpeta === null) return undefined;
  const ruta = path.join(carpeta, archivo);
  if (!existsSync(ruta)) {
    console.warn(`  (sin foto: no está ${archivo})`);
    return undefined;
  }
  return almacenamiento.guardar(
    { contenido: await readFile(ruta), tipo: 'image/jpeg' },
    'proyectos',
  );
}

async function sembrarGranitos(carpetaFotos: string | null) {
  const ids = new Map<string, mongoose.Types.ObjectId>();
  for (const [indice, granito] of GRANITOS.entries()) {
    const existente = await GranitoModelo.findOne({ nombre: granito.nombre }).select('_id').lean();
    if (existente) {
      ids.set(granito.nombre, existente._id);
      continue;
    }

    const imagenUrl = await almacenamiento.guardar(
      {
        contenido: texturaPng(granito.base, granito.vena, granito.estilo, indice + 3),
        tipo: 'image/png',
      },
      'granitos',
    );
    const fotoUrl = await guardarFoto(carpetaFotos, granito.foto);
    const { nombre, tipo, acabado, etiquetas } = granito;
    const creado = await GranitoModelo.create({
      nombre,
      tipo,
      acabado,
      etiquetas,
      imagenUrl,
      ...(fotoUrl && { fotoUrl }),
    });
    ids.set(nombre, creado._id);
    console.info(`  piedra ${nombre}${fotoUrl ? ' (con foto)' : ''}`);
  }
  return ids;
}

async function sembrarMuebles() {
  const ids = new Map<string, mongoose.Types.ObjectId>();
  for (const [nombre, espacio, tipo, material, colorHex, [anchoCm, altoCm, fondoCm]] of MUEBLES) {
    const existente = await MuebleModelo.findOne({ nombre }).select('_id').lean();
    const mueble =
      existente ??
      (await MuebleModelo.create({
        nombre,
        espacio,
        tipo,
        material,
        colorHex,
        anchoCm,
        altoCm,
        fondoCm,
      }));
    if (!existente) console.info(`  mueble ${nombre}`);
    ids.set(nombre, mueble._id);
  }
  return ids;
}

function buscarId(ids: Map<string, mongoose.Types.ObjectId>, nombre: string) {
  const id = ids.get(nombre);
  if (!id) throw new Error(`El seed menciona "${nombre}", que no está en el catálogo`);
  return id;
}

async function sembrarDisenos(
  granitos: Map<string, mongoose.Types.ObjectId>,
  muebles: Map<string, mongoose.Types.ObjectId>,
) {
  for (const diseno of DISENOS) {
    if (await DisenoModelo.exists({ nombre: diseno.nombre })) continue;

    const mueblesEnDiseno = diseno.muebles.map((item, indice) => {
      const [nombre, ubicacion] = typeof item === 'string' ? [item, undefined] : item;
      return {
        _id: new mongoose.Types.ObjectId(),
        mueble: buscarId(muebles, nombre),
        posicion: indice + 1,
        ...(ubicacion && { ubicacion }),
      };
    });
    const granito = buscarId(granitos, diseno.piedra);

    await DisenoModelo.create({
      nombre: diseno.nombre,
      espacio: diseno.espacio,
      forma: diseno.forma,
      medidasM: diseno.medidasM,
      acabados: diseno.acabados,
      // Los diseños de ejemplo se muestran en la página de inicio pública.
      codigoPublico: randomBytes(16).toString('base64url'),
      destacado: true,
      muebles: mueblesEnDiseno,
      objetos: diseno.objetos ?? [],
      materiales: [
        { pieza: 'meson', granito },
        { pieza: 'salpicadero', granito },
      ],
    });
    console.info(`  diseño ${diseno.nombre}`);
  }
}

async function reiniciar() {
  const granitos = await GranitoModelo.find().select('imagenUrl fotoUrl').lean();
  const muebles = await MuebleModelo.find().select('imagenUrl').lean();
  const urls = [
    ...granitos.flatMap(({ imagenUrl, fotoUrl }) => [imagenUrl, fotoUrl]),
    ...muebles.map(({ imagenUrl }) => imagenUrl),
  ].filter((url): url is string => Boolean(url));
  await Promise.all(urls.map((url) => almacenamiento.eliminar(url)));
  await Promise.all([
    GranitoModelo.deleteMany({}),
    MuebleModelo.deleteMany({}),
    DisenoModelo.deleteMany({}),
  ]);
  console.info('  catálogo y diseños borrados');
}

const { values } = parseArgs({
  options: {
    reiniciar: { type: 'boolean', default: false },
    fotos: { type: 'string', default: 'semilla-fotos' },
  },
});

if (env.NODE_ENV === 'production') {
  console.error('El seed es solo para desarrollo: crea usuarios con contraseñas conocidas.');
  process.exit(1);
}

const carpetaFotos = existsSync(values.fotos) ? path.resolve(values.fotos) : null;
if (carpetaFotos === null) {
  console.info(`  (no hay carpeta de fotos "${values.fotos}": las piedras quedan sin foto real)`);
}

try {
  await conectarBaseDatos();
  await mongoose.connection.syncIndexes();
  if (values.reiniciar) await reiniciar();

  await sembrarUsuarios();
  const granitos = await sembrarGranitos(carpetaFotos);
  const muebles = await sembrarMuebles();
  await sembrarDisenos(granitos, muebles);
  console.info('Seed listo.');
} catch (error) {
  console.error('El seed falló:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
