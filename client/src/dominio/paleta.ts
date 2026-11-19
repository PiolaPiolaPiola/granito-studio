/**
 * Colores sacados de las fotos de trabajos reales del taller (cocinas y baños terminados).
 * Son los acabados que más se repiten: maderas, lacas y las piedras del catálogo.
 */
export interface ColorPaleta {
  nombre: string
  hex: string
}

/** Acabados de muebles vistos en las fotos. */
export const PALETA_MUEBLES: ColorPaleta[] = [
  { nombre: 'Roble claro', hex: '#c9b49a' },
  { nombre: 'Nogal', hex: '#a8774e' },
  { nombre: 'Pino natural', hex: '#c8893f' },
  { nombre: 'Fresno blanco', hex: '#e4dccf' },
  { nombre: 'Wengué', hex: '#4a3f3d' },
  { nombre: 'Caoba', hex: '#6b3b2a' },
  { nombre: 'Antracita', hex: '#3a3d40' },
  { nombre: 'Verde oliva', hex: '#6f7559' },
  { nombre: 'Greige', hex: '#cfc8bc' },
  { nombre: 'Gris mármol', hex: '#8e9193' },
  { nombre: 'Blanco', hex: '#f2f1ee' },
  { nombre: 'Acero', hex: '#a7a9ac' },
]

/** Piedras de las fotos, para pintar una pieza con un color liso parecido. */
export const PALETA_PIEDRAS: ColorPaleta[] = [
  { nombre: 'Blanco nieve', hex: '#f2f1ee' },
  { nombre: 'Gris claro', hex: '#c9caca' },
  { nombre: 'Gris medio', hex: '#8c8f91' },
  { nombre: 'Gris estelar', hex: '#6e7073' },
  { nombre: 'Antracita', hex: '#3a3d40' },
  { nombre: 'Negro estelar', hex: '#141416' },
  { nombre: 'Beige', hex: '#d9cbb8' },
  { nombre: 'Moca', hex: '#9c8068' },
]

/** Colores comunes de pintura para paredes. */
export const PALETA_PAREDES: ColorPaleta[] = [
  { nombre: 'Blanco hueso', hex: '#f3f0ea' },
  { nombre: 'Blanco puro', hex: '#fafafa' },
  { nombre: 'Gris perla', hex: '#d9d9d6' },
  { nombre: 'Beige arena', hex: '#e8dccb' },
  { nombre: 'Verde salvia', hex: '#c9d2c0' },
  { nombre: 'Azul niebla', hex: '#c8d3db' },
  { nombre: 'Terracota suave', hex: '#d9b8a3' },
  { nombre: 'Gris carbón', hex: '#5c5f62' },
]

/** Pisos comunes (el color tiñe la textura de baldosas). */
export const PALETA_PISOS: ColorPaleta[] = [
  { nombre: 'Porcelanato beige', hex: '#e3ddd3' },
  { nombre: 'Blanco mármol', hex: '#efefed' },
  { nombre: 'Gris cemento', hex: '#a9a9a6' },
  { nombre: 'Madera clara', hex: '#c8a77e' },
  { nombre: 'Madera oscura', hex: '#7a5638' },
  { nombre: 'Negro mate', hex: '#3a3a3c' },
]

export const PALETA_TECHOS: ColorPaleta[] = [
  { nombre: 'Blanco', hex: '#fafafa' },
  { nombre: 'Blanco hueso', hex: '#f3f0ea' },
  { nombre: 'Gris claro', hex: '#e2e2e0' },
  { nombre: 'Madera', hex: '#c8a77e' },
]

/** Color por defecto de los muebles nuevos: el roble claro, el acabado más común en las fotos. */
export const COLOR_MUEBLE_POR_DEFECTO = PALETA_MUEBLES[0].hex
