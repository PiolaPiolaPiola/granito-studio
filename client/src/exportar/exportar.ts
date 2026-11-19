import type { Object3D } from 'three'

/** Nombre de archivo seguro: sin tildes ni símbolos raros. */
export function nombreArchivo(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return limpio || 'diseno'
}

function descargar(url: string, archivo: string) {
  const enlace = document.createElement('a')
  enlace.download = archivo
  enlace.href = url
  enlace.click()
}

/**
 * Imagen PNG de lo que se ve en el lienzo (necesita `preserveDrawingBuffer`). Si el diseño se
 * está viendo sobre la foto del espacio, la foto va de fondo (recortada como `cover`).
 */
export async function descargarImagen(lienzo: HTMLCanvasElement, nombre: string, fondoUrl?: string) {
  if (fondoUrl === undefined) {
    descargar(lienzo.toDataURL('image/png'), `${nombreArchivo(nombre)}.png`)
    return
  }
  const foto = new Image()
  foto.src = fondoUrl
  await foto.decode()
  const salida = document.createElement('canvas')
  salida.width = lienzo.width
  salida.height = lienzo.height
  const ctx = salida.getContext('2d')
  if (ctx === null) return
  const escala = Math.max(salida.width / foto.width, salida.height / foto.height)
  const w = foto.width * escala
  const h = foto.height * escala
  ctx.drawImage(foto, (salida.width - w) / 2, (salida.height - h) / 2, w, h)
  ctx.drawImage(lienzo, 0, 0)
  descargar(salida.toDataURL('image/png'), `${nombreArchivo(nombre)}.png`)
}

/**
 * Modelo 3D en formato glTF binario (.glb): se abre en Windows (Visor 3D), Blender,
 * SketchUp o se comparte por WhatsApp. El exportador se carga solo cuando se usa.
 */
export async function descargarModelo3D(escena: Object3D, nombre: string) {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const resultado = await new GLTFExporter().parseAsync(escena, { binary: true, onlyVisible: true })
  const blob = new Blob([resultado as ArrayBuffer], { type: 'model/gltf-binary' })
  const url = URL.createObjectURL(blob)
  descargar(url, `${nombreArchivo(nombre)}.glb`)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
