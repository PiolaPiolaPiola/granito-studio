// Texturas procedurales: imagen SVG (ruido fractal) usada como `imagenUrl` cuando no hay fotos reales
// (mocks y landing pública). Con el backend real la `imagenUrl` es una foto subida.

export type EstiloTextura = 'grano' | 'vena' | 'liso'

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export function texturaSvg(base: string, vena: string, estilo: EstiloTextura, semilla: number): string {
  const [r, g, b] = rgb(vena)
  const ruido =
    estilo === 'vena'
      ? { tipo: 'turbulence', frecuencia: '0.006 0.022', octavas: 5, alfa: '-7 0 0 0 1.9' }
      : estilo === 'grano'
        ? { tipo: 'fractalNoise', frecuencia: '0.45', octavas: 3, alfa: '6 0 0 0 -2.7' }
        : { tipo: 'fractalNoise', frecuencia: '0.8', octavas: 2, alfa: '4 0 0 0 -2' }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">` +
    `<filter id="f" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="${ruido.tipo}" baseFrequency="${ruido.frecuencia}" numOctaves="${ruido.octavas}" seed="${semilla}" stitchTiles="stitch"/>` +
    `<feColorMatrix values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} ${ruido.alfa}"/></filter>` +
    `<rect width="512" height="512" fill="${base}"/><rect width="512" height="512" filter="url(#f)"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
