import { cargarImagen } from './colores'

/** Lado mayor de la foto que se envía a la IA. Más grande no mejora el resultado y gasta más tokens. */
const LADO_MAXIMO = 768

/**
 * Reduce la foto antes de mandarla a la IA: un JPEG de ~768 px pesa decenas de KB en vez de
 * varios MB (subida más rápida y menos tokens de imagen en los planes gratuitos).
 */
export async function reducirImagen(archivo: Blob): Promise<Blob> {
  const imagen = await cargarImagen(archivo)
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(imagen.width * escala)
  canvas.height = Math.round(imagen.height * escala)
  const ctx = canvas.getContext('2d')
  if (ctx === null) return archivo
  ctx.drawImage(imagen, 0, 0, canvas.width, canvas.height)
  return new Promise((resolver) => {
    canvas.toBlob((blob) => resolver(blob ?? archivo), 'image/jpeg', 0.82)
  })
}
