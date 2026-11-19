const VARIANTES: Record<string, string> = {
  a: '[aáàäâ]',
  e: '[eéèëê]',
  i: '[iíìïî]',
  o: '[oóòöô]',
  u: '[uúùüû]',
  n: '[nñ]',
};

export function regexSinTildes(texto: string): RegExp {
  const sinTildes = texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const escapado = sinTildes.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patron = escapado.replace(/[aeioun]/g, (letra) => VARIANTES[letra] ?? letra);
  return new RegExp(patron, 'i');
}
