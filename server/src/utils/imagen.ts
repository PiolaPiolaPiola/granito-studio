export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type TipoImagen = (typeof TIPOS_IMAGEN)[number];

export const EXTENSIONES_IMAGEN: Record<TipoImagen, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function esTipoImagen(tipo: string): tipo is TipoImagen {
  return (TIPOS_IMAGEN as readonly string[]).includes(tipo);
}

function empiezaCon(buffer: Buffer, bytes: number[], desde = 0): boolean {
  return bytes.every((byte, i) => buffer[desde + i] === byte);
}

export function detectarTipoImagen(buffer: Buffer): TipoImagen | null {
  if (empiezaCon(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (empiezaCon(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (
    empiezaCon(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    empiezaCon(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }
  return null;
}
