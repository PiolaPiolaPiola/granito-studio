const aHex = (n: number, largo: number) => n.toString(16).padStart(largo, '0')

/**
 * Genera un ObjectId válido para Mongo (24 hex) en el navegador. El backend pide
 * que el cliente asigne el `_id` de cada mueble dentro de un diseño, porque los
 * materiales lo referencian (`muebleEnDiseno`) antes de que el diseño se guarde.
 */
export function generarObjectId(): string {
  const segundos = aHex(Math.floor(Date.now() / 1000), 8)
  const aleatorio = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => aHex(b, 2)).join('')
  return segundos + aleatorio
}
