import { crc32, deflateSync } from 'node:zlib';

/**
 * Texturas de piedra generadas por código para el seed (no hay fotos reales todavía).
 * Escribe un PNG a mano: firma + bloques IHDR, IDAT (píxeles comprimidos) e IEND.
 */

export type EstiloTextura = 'grano' | 'vena' | 'liso';
type Color = [number, number, number];

const TAMANO = 256;

function aColor(hex: string): Color {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mezclar(a: Color, b: Color, t: number): Color {
  const k = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** Ruido de valor: un número pseudoaleatorio por punto de la grilla, interpolado suave. */
function crearRuido(semilla: number) {
  const azar = (x: number, y: number) => {
    let h = (x * 374761393 + y * 668265263 + semilla * 982451653) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const suave = (t: number) => t * t * (3 - 2 * t);

  const ruido = (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = suave(x - x0);
    const ty = suave(y - y0);
    const arriba = azar(x0, y0) + (azar(x0 + 1, y0) - azar(x0, y0)) * tx;
    const abajo = azar(x0, y0 + 1) + (azar(x0 + 1, y0 + 1) - azar(x0, y0 + 1)) * tx;
    return arriba + (abajo - arriba) * ty;
  };

  /** Varias capas de ruido, cada una el doble de fina y la mitad de fuerte (fBm). */
  return (x: number, y: number, capas: number) => {
    let total = 0;
    let amplitud = 0.5;
    let frecuencia = 1;
    for (let capa = 0; capa < capas; capa += 1) {
      total += ruido(x * frecuencia, y * frecuencia) * amplitud;
      amplitud /= 2;
      frecuencia *= 2;
    }
    return total;
  };
}

function colorPixel(
  x: number,
  y: number,
  estilo: EstiloTextura,
  base: Color,
  vena: Color,
  fbm: ReturnType<typeof crearRuido>,
): Color {
  if (estilo === 'vena') {
    const turbulencia = fbm(x / 48, y / 48, 5);
    const onda = Math.abs(Math.sin((x + y * 0.4) / 22 + turbulencia * 9));
    const fondo = mezclar(base, vena, fbm(x / 90, y / 90, 3) * 0.25);
    return mezclar(fondo, vena, (1 - onda) ** 6);
  }
  if (estilo === 'grano') {
    const grano = fbm(x / 3, y / 3, 3);
    const manchas = fbm(x / 20, y / 20, 3);
    const fondo = mezclar(base, vena, manchas * 0.35);
    return mezclar(fondo, vena, grano > 0.58 ? (grano - 0.58) * 4 : 0);
  }
  return mezclar(base, vena, fbm(x / 60, y / 60, 4) * 0.18);
}

function bloque(tipo: string, datos: Buffer): Buffer {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const contenido = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const control = Buffer.alloc(4);
  control.writeUInt32BE(crc32(contenido));
  return Buffer.concat([largo, contenido, control]);
}

export function texturaPng(
  baseHex: string,
  venaHex: string,
  estilo: EstiloTextura,
  semilla: number,
): Buffer {
  const base = aColor(baseHex);
  const vena = aColor(venaHex);
  const fbm = crearRuido(semilla);

  // Cada fila empieza con un byte de filtro (0 = sin filtro) seguido de RGB por píxel.
  const filas = Buffer.alloc(TAMANO * (1 + TAMANO * 3));
  for (let y = 0; y < TAMANO; y += 1) {
    const inicio = y * (1 + TAMANO * 3);
    for (let x = 0; x < TAMANO; x += 1) {
      const [r, g, b] = colorPixel(x, y, estilo, base, vena, fbm);
      filas.writeUInt8(Math.round(r), inicio + 1 + x * 3);
      filas.writeUInt8(Math.round(g), inicio + 2 + x * 3);
      filas.writeUInt8(Math.round(b), inicio + 3 + x * 3);
    }
  }

  const cabecera = Buffer.alloc(13);
  cabecera.writeUInt32BE(TAMANO, 0);
  cabecera.writeUInt32BE(TAMANO, 4);
  cabecera.writeUInt8(8, 8); // 8 bits por canal
  cabecera.writeUInt8(2, 9); // RGB

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', cabecera),
    bloque('IDAT', deflateSync(filas)),
    bloque('IEND', Buffer.alloc(0)),
  ]);
}
